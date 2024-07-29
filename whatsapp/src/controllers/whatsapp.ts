import { listenMessage } from "./message/listenMessage";
import NodeCache from "node-cache";
import readline from "readline";
import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import MAIN_LOGGER from "../utils/logger";
import { logging } from "../kafka/producer";
import redisClient from "../redis/client";

const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const useStore = !process.argv.includes("--no-store");
const usePairingCode = process.argv.includes("--use-pairing-code");
const useMobile = process.argv.includes("--mobile");

const msgRetryCounterCache = new NodeCache();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text: string) =>
  new Promise<string>((resolve) => rl.question(text, resolve));
const store = useStore ? makeInMemoryStore({ logger }) : undefined;

const sessions: Map<string, any> = new Map();

const initializeStore = (sessionName: string) => {
  if (store) {
    store.readFromFile(`./auth/${sessionName}_baileys_store_multi.json`);
    setInterval(() => {
      store.writeToFile(`./auth/${sessionName}_baileys_store_multi.json`);
    }, 10000);
  }
};

const reconnect = async (sessionName: string, saveCreds: any) => {
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
      } else {
        logging("Logout due to 401 error");
        await redisClient.set(`whatsapp:${sessionName}:status`, "disconnected");
      }
    } else if (connection === "open") {
      logging("Reconnected to WhatsApp");
      await redisClient.set(`whatsapp:${sessionName}:status`, "connected");
    }
  });

  sock.ev.process(async (events: any) => {
    if (events["creds.update"]) {
      await saveCreds();
    }
  });
};

const connect = async (sessionName: string) => {
  const status = await redisClient.get(`whatsapp:${sessionName}:status`);
  if (status === "connected" || status === "connecting") {
    logging(`Session ${sessionName} is already connected or connecting.`);
    return;
  }

  await redisClient.set(`whatsapp:${sessionName}:status`, "connecting");
  initializeStore(sessionName);

  const { state, saveCreds } = await useMultiFileAuthState(
    `./auth/${sessionName}_baileys_auth_info`
  );
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !usePairingCode,
    mobile: useMobile,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
  });

  if (store) {
    store.bind(sock.ev);
  }

  sessions.set(sessionName, sock);
  await reconnect(sessionName, saveCreds);
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
