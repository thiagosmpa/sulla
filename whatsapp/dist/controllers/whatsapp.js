"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConnection = exports.sendTestMessage = exports.connectWhatsApp = void 0;
const sendMessage_1 = require("./message/sendMessage");
const listenMessage_1 = require("./message/listenMessage");
const node_cache_1 = __importDefault(require("node-cache"));
const readline_1 = __importDefault(require("readline"));
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("../utils/logger"));
const targetId = '553597475292-1556895408@g.us';
const logger = logger_1.default.child({});
logger.level = 'trace';
const useStore = !process.argv.includes('--no-store');
const usePairingCode = process.argv.includes('--use-pairing-code');
const useMobile = process.argv.includes('--mobile');
const msgRetryCounterCache = new node_cache_1.default();
const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const store = useStore ? (0, baileys_1.makeInMemoryStore)({ logger }) : undefined;
let sock;
const initializeStore = (sessionName) => {
    if (store) {
        store.readFromFile(`./${sessionName}_baileys_store_multi.json`);
        setInterval(() => {
            store.writeToFile(`./${sessionName}_baileys_store_multi.json`);
        }, 10000);
    }
};
const reconnect = (saveCreds) => __awaiter(void 0, void 0, void 0, function* () {
    sock.ev.on('connection.update', (update) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== 401) {
                yield connect();
            }
            else {
                logger.error('Logout due to 401 error');
            }
        }
        else if (connection === 'open') {
            logger.info('Connected to WhatsApp');
        }
    }));
    sock.ev.process((events) => __awaiter(void 0, void 0, void 0, function* () {
        if (events['creds.update']) {
            yield saveCreds();
        }
    }));
});
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    const sessionName = 'default-session';
    initializeStore(sessionName);
    const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(`./${sessionName}_baileys_auth_info`);
    const { version, isLatest } = yield (0, baileys_1.fetchLatestBaileysVersion)();
    logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
    sock = (0, baileys_1.default)({
        version,
        logger,
        printQRInTerminal: !usePairingCode,
        mobile: useMobile,
        auth: {
            creds: state.creds,
            keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
    });
    if (store) {
        store.bind(sock.ev);
    }
    yield reconnect(saveCreds);
    yield (0, listenMessage_1.listenMessage)(sock);
});
const connectWhatsApp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield connect();
        res.status(200).json({ status: 'success', message: 'WhatsApp connected successfully' });
    }
    catch (error) {
        logger.error('Failed to connect to WhatsApp', error);
        res.status(500).json({ status: 'error', message: 'Failed to connect to WhatsApp', error: error.message });
    }
});
exports.connectWhatsApp = connectWhatsApp;
const isWhatsAppConnected = () => !!sock;
const sendTestMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isWhatsAppConnected()) {
            return res.status(400).json({ status: 'error', message: 'WhatsApp is not connected' });
        }
        yield (0, sendMessage_1.sendMessage)(sock);
        res.status(200).json({ status: 'success', message: 'Test message sent successfully' });
    }
    catch (error) {
        logger.error('Failed to send test message', error);
        res.status(500).json({ status: 'error', message: 'Failed to send test message', error: error.message });
    }
});
exports.sendTestMessage = sendTestMessage;
const checkConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isWhatsAppConnected()) {
            return res.status(400).json({ status: 'error', message: 'WhatsApp is not connected' });
        }
        res.status(200).json({ status: 'success', message: 'WhatsApp is connected' });
    }
    catch (error) {
        logger.error('Failed to check WhatsApp connection', error);
        res.status(500).json({ status: 'error', message: 'Failed to check WhatsApp connection', error: error.message });
    }
});
exports.checkConnection = checkConnection;
