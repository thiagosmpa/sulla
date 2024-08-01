import { listenMessage } from "./message/listenMessage";
import NodeCache from "node-cache";
import readline from "readline";
import makeWASocket, {
  fetchLatestBaileysVersion,
  AuthenticationState,
  BaileysEventEmitter,
} from "@whiskeysockets/baileys";
import MAIN_LOGGER from "../utils/logger";
import { logging } from "../kafka/producer";
import redisClient from "../redis/client";
import prisma from "../db";
import BaileysBottle from "baileys-bottle";

const sesion_url = process.env.BOTTLE_URL;

const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const usePairingCode = process.argv.includes("--use-pairing-code");
const useMobile = process.argv.includes("--mobile");

const msgRetryCounterCache = new NodeCache();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text: string) =>
  new Promise<string>((resolve) => rl.question(text, resolve));

const sessions: Map<string, any> = new Map();

const reconnect = async (sessionName: string, saveState: any) => {
  const sock = sessions.get(sessionName);
  
  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== 401) {
        const status = await redisClient.get(`whatsapp:${sessionName}:status`);
        if (status !== "connecting") {
          await redisClient.set(`whatsapp:${sessionName}:status`, "connecting");
          await connect(sessionName);
          await redisClient.set(`whatsapp:${sessionName}:status`, "connected");
        }
      }
    } else if (connection === "open") {
      logging("Reconnected to WhatsApp");
      await redisClient.set(`whatsapp:${sessionName}:status`, "connected");
    }
  });

  (sock.ev as BaileysEventEmitter).on("creds.update", async () => {
    await saveState();
  });
};

const connect = async (sessionName: string) => {
  const status = await redisClient.get(`whatsapp:${sessionName}:status`);

  await redisClient.set(`whatsapp:${sessionName}:status`, "connecting");

  // Inicialize o BaileysBottle
  const bottle = await BaileysBottle.init({
    type: "postgres",
    url: sesion_url,
  });

  console.log("Creating store...");
  const { auth, store } = await bottle.createStore(sessionName);
  console.log("Creating auth...");
  const { state, saveState } = await auth.useAuthHandle();
  console.log("Done");

  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !usePairingCode,
    mobile: useMobile,
    auth: state as unknown as AuthenticationState,
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
  });

  // Crie um wrapper para o store.bind
  const wrappedBind = (ev: BaileysEventEmitter) => {
    // @ts-ignore
    store.bind(ev);
  };

  wrappedBind(sock.ev);

  sessions.set(sessionName, sock);
  await reconnect(sessionName, saveState);
  await listenMessage(sock, sessionName);
  await redisClient.set(`whatsapp:${sessionName}:status`, "connected");
};

export const connectSession = async (sessionName: string) => {
  try {
    await connect(sessionName);
    logging(`WhatsApp connected successfully with session ${sessionName}`);
  } catch (error: any) {
    logging(`Failed to connect to WhatsApp \n${error}\n`);
    await redisClient.set(`whatsapp:${sessionName}:status`, "disconnected");
  }
};

const isWhatsAppConnected = (sessionName: string) =>
  !!sessions.get(sessionName);

export const checkConnection = async (sessionName: string) => {
  try {
    return isWhatsAppConnected(sessionName);
  } catch (error: any) {
    logging(`Failed to check WhatsApp connection: ${error}`);
  }
};