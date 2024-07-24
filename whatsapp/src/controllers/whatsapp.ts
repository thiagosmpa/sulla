import { Request, Response } from 'express';
import { listenMessage } from './message/listenMessage';
import NodeCache from 'node-cache';
import readline from 'readline';
import makeWASocket, { fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, useMultiFileAuthState } from '@whiskeysockets/baileys';
import MAIN_LOGGER from '../utils/logger';
import { logging } from '../kafka/producer';

const targetId = '553597475292-1556895408@g.us';

const logger = MAIN_LOGGER.child({});
logger.level = 'trace';

const useStore = !process.argv.includes('--no-store');
const usePairingCode = process.argv.includes('--use-pairing-code');
const useMobile = process.argv.includes('--mobile');

const msgRetryCounterCache = new NodeCache();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve));
const store = useStore ? makeInMemoryStore({ logger }) : undefined;

const sessions: Map<string, any> = new Map();

const initializeStore = (sessionName: string) => {
  if (store) {
    store.readFromFile(`./${sessionName}_baileys_store_multi.json`);
    setInterval(() => {
      store.writeToFile(`./${sessionName}_baileys_store_multi.json`);
    }, 10000);
  }
};

const reconnect = async (sessionName: string, saveCreds: any) => {
  const sock = sessions.get(sessionName);
  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== 401) {
        await connect(sessionName);
      } else {
        logging('Logout due to 401 error');
      }
    } else if (connection === 'open') {
      logging('Reconnected to WhatsApp');
    }
  });

  sock.ev.process(async (events: any) => {
    if (events['creds.update']) {
      await saveCreds();
    }
  });
};

const connect = async (sessionName: string) => {
  initializeStore(sessionName);

  const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName}_baileys_auth_info`);
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
};

export const connectSession = async (sessionName: string) => {
  try {
    await connect(sessionName);
    logging(`WhatsApp connected successfully with session ${sessionName}`);
  } catch (error: any) {
    logging(`Failed to connect to WhatsApp \n${error}\n`);
  }
};

const isWhatsAppConnected = (sessionName: string) => !!sessions.get(sessionName);

export const checkConnection = async (req: Request, res: Response) => {
  const sessionName = req.query.sessionName as string;
  try {
    if (!isWhatsAppConnected(sessionName)) {
      return res.status(400).json({ status: 'error', message: 'WhatsApp is not connected' });
    }
    res.status(200).json({ status: 'success', message: 'WhatsApp is connected' });
  } catch (error: any) {
    logger.error('Failed to check WhatsApp connection', error);
    res.status(500).json({ status: 'error', message: 'Failed to check WhatsApp connection', error: error.message });
  }
};
