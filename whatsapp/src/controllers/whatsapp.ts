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
const msgRetryCounterCache = new NodeCache();

export function getSessionSocket(sessionName: string) {
  const sessionInfo = sessions.get(sessionName);
  return sessionInfo ? sessionInfo.sock : null;
}

async function initializeSessions() {
  const allUsers = await prisma.users.findMany();
  for (const user of allUsers) {
    try {
      await connectSession(user.name);
    } catch (error) {
      logging(`Failed to initialize session for user ${user.name}: ${error}`);
    }
  }
}

async function updateSessionStatus(userName: string, status: string) {
  await prisma.users.update({
    where: { userId: userName },
    data: { connectionStatus: status },
  });
}

async function getSessionStatus(userName: string): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { userId: userName },
    select: { connectionStatus: true },
  });
  return user?.connectionStatus || null;
}

async function createOrUpdateSessionState(userName: string, state: any) {
  await prisma.session.upsert({
    where: { name: userName },
    update: { state: JSON.stringify(state) },
    create: { name: userName, state: JSON.stringify(state) },
  });
}

async function handleConnectionUpdate(
  userName: string,
  update: any,
  connect: Function
) {
  const { connection, lastDisconnect } = update;
  if (connection === "close") {
    const shouldReconnect =
      (lastDisconnect?.error as Boom)?.output?.statusCode !==
      DisconnectReason.loggedOut;
    if (shouldReconnect) {
      logging(`Reconnecting ${userName}...`);
      await connect(userName);
    } else {
      logging(`Connection closed for ${userName}. Logged out.`);
      await updateSessionStatus(userName, "disconnected");
      sessions.delete(userName);
    }
  } else if (connection === "open") {
    logging(`Connected ${userName} successfully`);
    await updateSessionStatus(userName, "connected");
    const sessionInfo = sessions.get(userName);
    if (sessionInfo) {
      sessionInfo.lastActivity = new Date();
    }
  }
}

async function setupSocket(
  userName: string,
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

  sock.ev.on("connection.update", (update) =>
    handleConnectionUpdate(userName, update, connect)
  );
  sock.ev.on("creds.update", saveState);

  return sock;
}

async function connect(userName: string, initialState?: any) {
  await updateSessionStatus(userName, "connecting");

  try {
    const bottle = await BaileysBottle.init({
      type: "postgres",
      url: sesion_url,
    });
    const { auth, store } = await bottle.createStore(userName);

    const { state, saveState } = initialState
      ? {
          state: initialState,
          saveState: async () => {
            await createOrUpdateSessionState(userName, initialState);
          },
        }
      : await auth.useAuthHandle();

    await createOrUpdateSessionState(userName, state);

    const sock = await setupSocket(userName, state, saveState);
    // @ts-ignore
    store.bind(sock.ev);

    const existingSessionInfo = sessions.get(userName);
    if (existingSessionInfo) {
      existingSessionInfo.sock = sock;
      existingSessionInfo.lastActivity = new Date();
    } else {
      sessions.set(userName, { sock, lastActivity: new Date() });
    }

    await listenMessage(sock, userName);

    logging(`WhatsApp connected successfully for user ${userName}`);
    await updateSessionStatus(userName, "connected");
  } catch (error) {
    logging(`Failed to connect WhatsApp for user ${userName}: ${error}`);
    await updateSessionStatus(userName, "disconnected");
    throw error;
  }
}

export async function connectSession(userName: string) {
  try {
    const existingUser = await prisma.users.findUnique({
      where: { name: userName },
    });
    const currentStatus = await getSessionStatus(userName);

    if (existingUser && currentStatus === "connected") {
      logging(
        `Session for user ${userName} is already connected. Skipping connection.`
      );
      return;
    }

    const existingSession = await prisma.session.findUnique({
      where: { name: userName },
    });
    if (existingSession) {
      logging(`Restoring existing session for user ${userName}`);
      const state = JSON.parse(existingSession.state);

      if (currentStatus === "disconnected") {
        await connect(userName, state);
      } else {
        logging(
          `Session for user ${userName} is in ${currentStatus} state. Skipping connection.`
        );
      }
    } else {
      logging(`Creating new session for user ${userName}`);
      await connect(userName);
    }
  } catch (error: any) {
    logging(`Failed to connect WhatsApp for user ${userName}: ${error}`);
    await updateSessionStatus(userName, "disconnected");
    throw error;
  }
}

export async function isWhatsAppConnected(userName: string) {
  const status = await getSessionStatus(userName);
  return status === "connected";
}

export async function checkConnection(userName: string) {
  try {
    return await isWhatsAppConnected(userName);
  } catch (error: any) {
    logging(
      `Failed to check WhatsApp connection for user ${userName}: ${error}`
    );
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
