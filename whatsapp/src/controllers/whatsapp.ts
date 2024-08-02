import { PrismaClient } from "@prisma/client";
import BaileysBottle from "baileys-bottle";
import { Boom } from "@hapi/boom";
import NodeCache from "node-cache";
import makeWASocket, {
  fetchLatestBaileysVersion,
  AuthenticationState,
  AuthenticationCreds,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import MAIN_LOGGER from "../utils/logger";
import { logging } from "../kafka/producer";
import { listenMessage } from "./message/listenMessage";

const prisma = new PrismaClient();
const sesion_url = process.env.BOTTLE_URL;
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const usePairingCode = process.argv.includes("--use-pairing-code");
const useMobile = process.argv.includes("--mobile");

interface SessionInfo {
  sock: any;
  lastActivity: Date;
  heartbeatInterval: NodeJS.Timeout | null;
}

const sessions: Map<string, SessionInfo> = new Map();
const connectionStatus: Map<string, string> = new Map();
const connectingSessionsInProgress = new Map<string, boolean>();

const msgRetryCounterCache = new NodeCache();

const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000; // 5 segundos

export function getSessionSocket(sessionName: string) {
  const sessionInfo = sessions.get(sessionName);
  return sessionInfo ? sessionInfo.sock : null;
}

export function getConnectionStatus(sessionName: string) {
  return connectionStatus.get(sessionName);
}
function isSessionEffectivelyConnected(status: string): boolean {
  return ["CONNECTED", "AUTHENTICATED_ACTIVE", "AUTHENTICATED_IDLE", "AUTHENTICATED_INACTIVE"].includes(status);
}

async function initializeSessions() {
  const allUsers = await prisma.users.findMany();
  for (const user of allUsers) {
    try {
      await connectSession(user.userId);
    } catch (error) {
      logging(`Failed to initialize session for user ${user.userId}: ${error}`);
    }
  }
}

async function createOrUpdateSessionState(sessionName: string, state: any) {
  await prisma.session.upsert({
    where: { name: sessionName },
    update: { state: JSON.stringify(state) },
    create: { name: sessionName, state: JSON.stringify(state) },
  });
}

function startHeartbeat(sessionName: string, sock: any) {
  const interval = setInterval(() => {
    if (sock.ws.readyState === WebSocket.OPEN) {
      sock.sendRawMessage("2").catch((error: any) => {
        logging(`Heartbeat failed for ${sessionName}: ${error}`);
        updateSessionStatus(sessionName, "DISCONNECTED");
      });
    } else {
      updateSessionStatus(sessionName, "DISCONNECTED");
    }
  }, HEARTBEAT_INTERVAL);

  const sessionInfo = sessions.get(sessionName);
  if (sessionInfo) {
    sessionInfo.heartbeatInterval = interval;
  }
}

function stopHeartbeat(sessionName: string) {
  const sessionInfo = sessions.get(sessionName);
  if (sessionInfo && sessionInfo.heartbeatInterval) {
    clearInterval(sessionInfo.heartbeatInterval);
    sessionInfo.heartbeatInterval = null;
  }
}

async function setupSocket(
  sessionName: string,
  state: any,
  saveState: (creds: Partial<AuthenticationCreds>) => Promise<void>
) {
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !usePairingCode,
    mobile: useMobile,
    auth: state as unknown as AuthenticationState,
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "connecting") {
      updateSessionStatus(sessionName, "CONNECTING");
    } else if (connection === "open") {
      updateSessionStatus(sessionName, "CONNECTED");
      startHeartbeat(sessionName, sock);
    } else if (connection === "close") {
      stopHeartbeat(sessionName);
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        logging(`Reconnecting ${sessionName}...`);
        updateSessionStatus(sessionName, "RECONNECTING");
        await reconnect(sessionName);
      } else {
        logging(`Connection closed for ${sessionName}. Logged out.`);
        updateSessionStatus(sessionName, "DISCONNECTED");
        sessions.delete(sessionName);
      }
    }
  });

  return sock;
}

async function reconnect(sessionName: string, attempt: number = 1) {
  if (attempt > MAX_RECONNECT_ATTEMPTS) {
    logging(`Max reconnection attempts reached for ${sessionName}`);
    updateSessionStatus(sessionName, "DISCONNECTED");
    sessions.delete(sessionName);
    return;
  }

  try {
    await connect(sessionName);
  } catch (error) {
    logging(
      `Reconnection attempt ${attempt} failed for ${sessionName}: ${error}`
    );
    setTimeout(() => reconnect(sessionName, attempt + 1), RECONNECT_INTERVAL);
  }
}

async function connect(sessionName: string, initialState?: any) {
  try {
    const bottle = await BaileysBottle.init({
      type: "postgres",
      url: sesion_url,
    });
    const { auth, store } = await bottle.createStore(sessionName);

    const { state, saveState } = initialState
      ? {
          state: initialState,
          saveState: async () => {
            await createOrUpdateSessionState(sessionName, initialState);
          },
        }
      : await auth.useAuthHandle();

    await createOrUpdateSessionState(sessionName, state);

    const sock = await setupSocket(sessionName, state, saveState);
    // @ts-ignore
    store.bind(sock.ev);

    const existingSessionInfo = sessions.get(sessionName);
    if (existingSessionInfo) {
      existingSessionInfo.sock = sock;
      existingSessionInfo.lastActivity = new Date();
    } else {
      sessions.set(sessionName, {
        sock,
        lastActivity: new Date(),
        heartbeatInterval: null,
      });
    }

    await listenMessage(sock, sessionName);

    logging(`WhatsApp connected successfully for user ${sessionName}`);
    updateSessionStatus(sessionName, "CONNECTED");
  } catch (error) {
    logging(`Failed to connect WhatsApp for user ${sessionName}: ${error}`);
    updateSessionStatus(sessionName, "DISCONNECTED");
    sessions.delete(sessionName);
    throw error;
  }
}

export async function connectSession(sessionName: string) {
  try {
    const currentStatus = getSessionStatus(sessionName);

    // Prevent concurrent connection attempts
    if (isSessionEffectivelyConnected(currentStatus) || connectingSessionsInProgress.get(sessionName)) {
      logging(`Session ${sessionName} is already connected/connecting (${currentStatus}). Skipping.`);
      return;
    }

    connectingSessionsInProgress.set(sessionName, true); // Mark connection in progress

    const existingUser = await prisma.users.findUnique({
      where: { userId: sessionName },
    });

    if (!existingUser) {
      throw new Error(`User ${sessionName} not found`);
    }

    const existingSession = await prisma.session.findUnique({
      where: { name: sessionName },
    });

    if (existingSession) {
      logging(`Restoring existing session for user ${sessionName}`);
      const state = JSON.parse(existingSession.state);
      await connect(sessionName, state);
    } else {
      logging(`Creating new session for user ${sessionName}`);
      await connect(sessionName);
    }
  } catch (error: any) {
    logging(`Failed to connect WhatsApp for user ${sessionName}: ${error}`);
    await updateSessionStatus(sessionName, "DISCONNECTED"); // Update status even on failure
    throw error;
  } finally {
    connectingSessionsInProgress.delete(sessionName); // Always clear the flag
  }
}

async function updateSessionStatus(sessionName: string, status: string) {
  connectionStatus.set(sessionName, status);
  const sessionInfo = sessions.get(sessionName);
  if (sessionInfo) {
    sessionInfo.lastActivity = new Date();
  }
  logging(`Session ${sessionName} status updated to: ${status}`);
  await prisma.users.update({
    where: { userId: sessionName },
    data: { connectionStatus: status },
  });
}

export function getSessionStatus(sessionName: string): string {
  const sessionInfo = sessions.get(sessionName);
  if (!sessionInfo) {
    return "DISCONNECTED";
  }

  const { sock, lastActivity } = sessionInfo;

  if (!sock || !sock.user) {
    return "DISCONNECTED";
  }

  if (sock.ws.readyState !== WebSocket.OPEN) {
    return "DISCONNECTED";
  }

  const now = new Date();
  const timeSinceLastActivity = now.getTime() - lastActivity.getTime();

  if (timeSinceLastActivity < 5000) {
    // 5 segundos
    return "AUTHENTICATED_ACTIVE";
  } else if (timeSinceLastActivity < 60000) {
    // 1 minuto
    return "AUTHENTICATED_IDLE";
  } else {
    return "AUTHENTICATED_INACTIVE";
  }
}

export async function startServer() {
  await initializeSessions();
  logging("Server started and sessions initialized");
}

// Funções auxiliares (mantidas como estavam)
function getMessageType(message: any): string {
  return Object.keys(message.message || {})[0];
}

function isTextMessage(messageType: string): boolean {
  return (
    messageType === "conversation" || messageType === "extendedTextMessage"
  );
}

function getTextContent(message: any, messageType: string): string {
  if (messageType === "conversation") {
    return message.message.conversation;
  } else if (messageType === "extendedTextMessage") {
    return message.message.extendedTextMessage.text;
  }
  return "";
}
