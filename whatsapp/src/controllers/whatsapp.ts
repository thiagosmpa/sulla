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
import { logging, messageProducer } from "../kafka/producer";
import redisClient from "../redis/client";
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
  const allSessions = await prisma.session.findMany();
  for (const session of allSessions) {
    try {
      await connectSession(session.name);
    } catch (error) {
      logging(`Failed to initialize session ${session.name}: ${error}`);
    }
  }
}

async function updateSessionStatus(sessionName: string, status: string) {
  await redisClient.set(`whatsapp:${sessionName}:status`, status);
}

async function createOrUpdateSessionState(sessionName: string, state: any) {
  await prisma.session.upsert({
    where: { name: sessionName },
    update: { state: JSON.stringify(state) },
    create: { name: sessionName, state: JSON.stringify(state) },
  });
}

async function handleConnectionUpdate(sessionName: string, update: any, connect: Function) {
  const { connection, lastDisconnect } = update;
  if (connection === "close") {
    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
    if (shouldReconnect) {
      logging(`Reconnecting ${sessionName}...`);
      await connect(sessionName);
    } else {
      logging(`Connection closed for ${sessionName}. Logged out.`);
      await updateSessionStatus(sessionName, "disconnected");
      await prisma.session.delete({ where: { name: sessionName } });
      sessions.delete(sessionName);
    }
  } else if (connection === "open") {
    logging(`Connected ${sessionName} successfully`);
    await updateSessionStatus(sessionName, "connected");
    const sessionInfo = sessions.get(sessionName);
    if (sessionInfo) {
      sessionInfo.lastActivity = new Date();
    }
  }
}

async function setupSocket(sessionName: string, state: any, saveState: (creds: Partial<AuthenticationCreds>) => Promise<void>) {
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

  sock.ev.on("connection.update", (update) => handleConnectionUpdate(sessionName, update, connect));
  sock.ev.on("creds.update", saveState);

  return sock;
}

async function connect(sessionName: string, initialState?: any) {
  await updateSessionStatus(sessionName, "connecting");

  try {
    const bottle = await BaileysBottle.init({ type: "postgres", url: sesion_url });
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
    sessions.set(sessionName, { sock, lastActivity: new Date() });

    // Use a função listenMessage importada
    await listenMessage(sock, sessionName);

    logging(`WhatsApp connected successfully with session ${sessionName}`);
    await updateSessionStatus(sessionName, "connected");
  } catch (error) {
    logging(`Failed to connect WhatsApp for session ${sessionName}: ${error}`);
    await updateSessionStatus(sessionName, "disconnected");
    throw error;
  }
}

export async function connectSession(sessionName: string) {
  try {
    const existingSession = await prisma.session.findUnique({ where: { name: sessionName } });
    if (existingSession) {
      logging(`Restoring existing session ${sessionName}`);
      const state = JSON.parse(existingSession.state);
      await connect(sessionName, state);
    } else {
      logging(`Creating new session ${sessionName}`);
      await connect(sessionName);
    }
  } catch (error: any) {
    logging(`Failed to connect WhatsApp for session ${sessionName}: ${error}`);
    await updateSessionStatus(sessionName, "disconnected");
    throw error;
  }
}

export function isWhatsAppConnected(sessionName: string) {
  return !!sessions.get(sessionName);
}

export async function checkConnection(sessionName: string) {
  try {
    return isWhatsAppConnected(sessionName);
  } catch (error: any) {
    logging(`Failed to check WhatsApp connection: ${error}`);
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
  return messageType === "conversation" || messageType === "extendedTextMessage";
}

function getTextContent(message: any, messageType: string): string {
  if (messageType === "conversation") {
    return message.message.conversation;
  } else if (messageType === "extendedTextMessage") {
    return message.message.extendedTextMessage.text;
  }
  return "";
}