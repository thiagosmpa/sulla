"use strict";
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
exports.listenMessage = listenMessage;
const producer_1 = require("../../kafka/producer");
const client_1 = __importDefault(require("../../redis/client"));
const producer_2 = require("../../kafka/producer");
if (!global.sockInstance) {
    global.sockInstance = undefined;
}
const sessions = new Map();
function listenMessage(sock, sessionName) {
    return __awaiter(this, void 0, void 0, function* () {
        sessions.set("sessionName", sessionName);
        if (!global.sockInstance) {
            global.sockInstance = sock;
            sock.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
                const message = m.messages[0];
                const messageType = getMessageType(message);
                const chatId = message.key.remoteJid;
                // Verificar no Redis se a mensagem foi enviada pelo bot
                const sender = yield client_1.default.get(chatId);
                const textContent = getTextContent(message, messageType);
                // Filtra as mensagens
                if (sender !== "bot" && isTextMessage(messageType)) {
                    // Enviar mensagem ao Kafka
                    try {
                        yield (0, producer_1.messageProducer)(sessionName, chatId, textContent);
                        (0, producer_2.logging)(`Producer: ${sessionName}/${chatId}: ${textContent}`);
                    }
                    catch (error) {
                        (0, producer_2.logging)(`Producer error: ${error}`);
                    }
                }
                else if (sender === "bot") {
                    (0, producer_2.logging)(`Producer (ignored by bot): ${sessionName}/${chatId}: ${textContent}`);
                    yield client_1.default.set(chatId, "", { EX: 60 });
                }
                else {
                    (0, producer_2.logging)(`Producer (ignored): ${sessionName}/${chatId}: ${textContent}`);
                }
            }));
        }
    });
}
function getMessageType(message) {
    return Object.keys(message.message || {})[0];
}
function isGroupMessage(message) {
    var _a;
    return (_a = message.key.remoteJid) === null || _a === void 0 ? void 0 : _a.includes("@g.us");
}
function isTextMessage(messageType) {
    return (messageType === "conversation" || messageType === "extendedTextMessage");
}
function isSenderKey(messageType) {
    return messageType === "senderKeyDistributionMessage";
}
function canListen(message) {
    return (message.key.fromMe ||
        message.key.remoteJid === "553597475292-1556895408@g.us" ||
        message.key.remoteJid === "553591136988@s.whatsapp.net" ||
        message.key.remoteJid === "553591331792@s.whatsapp.net");
}
function getTextContent(message, messageType) {
    if (messageType === "conversation") {
        return message.message.conversation;
    }
    else if (messageType === "extendedTextMessage") {
        return message.message.extendedTextMessage.text;
    }
    return "";
}
