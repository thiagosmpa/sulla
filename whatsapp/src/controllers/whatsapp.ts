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
}

const sessions: Map<string, SessionInfo> = new Map();
const connectionStatus: Map<string, string> = new Map();

const msgRetryCounterCache = new NodeCache();

export function getSessionSocket(sessionName: string) {
  const sessionInfo = sessions.get(sessionName);
  return sessionInfo ? sessionInfo.sock : null;
}

export function getConnectionStatus(sessionName: string) {
  return connectionStatus.get(sessionName);
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
      connectionStatus.set(sessionName, "CONNECTING");
    } else if (connection === "open") {
      connectionStatus.set(sessionName, "CONNECTED");
      const sessionInfo = sessions.get(sessionName);
      if (sessionInfo) {
        sessionInfo.lastActivity = new Date();
      }
    } else if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        logging(`Reconnecting ${sessionName}...`);
        connectionStatus.set(sessionName, "RECONNECTING");
        await connect(sessionName);
      } else {
        logging(`Connection closed for ${sessionName}. Logged out.`);
        connectionStatus.set(sessionName, "DISCONNECTED");
        sessions.delete(sessionName);
      }
    }
    // Atualiza o status da sessão a cada atualização de conexão
    const status = getSessionStatus(sessionName);
    connectionStatus.set(sessionName, status);
    logging(`Session ${sessionName} status: ${status}`);
  });
  
  return sock;
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
      sessions.set(sessionName, { sock, lastActivity: new Date() });
    }

    await listenMessage(sock, sessionName);

    logging(`WhatsApp connected successfully for user ${sessionName}`);
    const status = getSessionStatus(sessionName);
    connectionStatus.set(sessionName, status);
    logging(`Session ${sessionName} status: ${status}`);
  } catch (error) {
    logging(`Failed to connect WhatsApp for user ${sessionName}: ${error}`);
    connectionStatus.set(sessionName, "DISCONNECTED");
    sessions.delete(sessionName);
    throw error;
  }
}

export async function connectSession(sessionName: string) {
  try {
    const existingUser = await prisma.users.findUnique({
      where: { userId: sessionName },
    });

    const existingSession = await prisma.session.findUnique({
      where: { name: sessionName },
    });

    const currentStatus = getSessionStatus(sessionName);
    if (
      currentStatus === "CONNECTING" ||
      currentStatus === "CONNECTED" ||
      currentStatus === "AUTHENTICATED"
    ) {
      logging(`Session ${sessionName} is already ${currentStatus}`);
      return;
    }

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
    connectionStatus.set(sessionName, "DISCONNECTED");
    throw error;
  }
}

export function getSessionStatus(sessionName: string): string {
  const sessionInfo = sessions.get(sessionName);
  if (!sessionInfo) {
    return "DISCONNECTED";
  }

  const { sock } = sessionInfo;
  
  if (!sock.user) {
    return ["CONNECTING", "CONNECTED", "DISCONNECTING", "DISCONNECTED"][sock.ws.readyState];
  }
  
  // Se chegamos aqui, o usuário está autenticado
  if (sock.ws.readyState !== WebSocket.OPEN) {
    return "AUTHENTICATED_DISCONNECTED";
  }
  
  // Verificar a última atividade
  const lastActivity = sessionInfo.lastActivity;
  const now = new Date();
  const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
  
  if (timeSinceLastActivity < 5000) { // 5 segundos
    return "AUTHENTICATED_ACTIVE";
  } else if (timeSinceLastActivity < 60000) { // 1 minuto
    return "AUTHENTICATED_IDLE";
  } else {
    return "AUTHENTICATED_INACTIVE";
  }
}

// Função para iniciar o servidor e inicializar as sessões
export async function startServer() {
  await initializeSessions();
  logging("Server started and sessions initialized");
}

// Funções auxiliares
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
