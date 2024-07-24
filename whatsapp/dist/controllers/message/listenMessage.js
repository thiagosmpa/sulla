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
exports.listenMessage = void 0;
const producer_1 = require("../../kafka/producer");
const consumer_1 = require("../../kafka/consumer");
const client_1 = __importDefault(require("../../redis/client"));
if (typeof global.kafkaConsumerStarted === 'undefined') {
    global.kafkaConsumerStarted = false;
}
function listenMessage(sock) {
    return __awaiter(this, void 0, void 0, function* () {
        sock.ev.on('messages.upsert', (m) => __awaiter(this, void 0, void 0, function* () {
            const message = m.messages[0];
            const messageType = getMessageType(message);
            const chatId = message.key.remoteJid;
            console.log(`\n\nmessageType: ${messageType}\n\n`);
            // Verificar no Redis se a mensagem foi enviada pelo bot
            const sender = yield client_1.default.get(chatId);
            if (sender !== 'bot' && isTextMessage(messageType)) {
                const textContent = getTextContent(message, messageType);
                console.log(`\n\nMessage content: ${textContent}\n\n`);
                // Enviar mensagem ao Kafka
                try {
                    yield (0, producer_1.messageQueue)(chatId, textContent);
                    console.log(`\n\nMessage sent to Kafka\n\n`);
                }
                catch (error) {
                    console.error(`\n\nError sending message to Kafka: ${error}\n\n`);
                }
            }
            else {
                console.log(`\n\nMessage from ${chatId} ignored (sent by bot)\n\n`);
            }
            if (isTextMessage(messageType) && !isGroupMessage(message) && sender !== 'bot') {
                console.log(`\n\nReceived new message from ${chatId}\n\n`);
            }
        }));
        // Iniciar o consumidor Kafka para enviar respostas
        if (!global.kafkaConsumerStarted) {
            yield (0, consumer_1.startConsumer)(sock);
            global.kafkaConsumerStarted = true;
        }
    });
}
exports.listenMessage = listenMessage;
function getMessageType(message) {
    return Object.keys(message.message || {})[0];
}
function isGroupMessage(message) {
    var _a;
    return (_a = message.key.remoteJid) === null || _a === void 0 ? void 0 : _a.includes('@g.us');
}
function isTextMessage(messageType) {
    return messageType === 'conversation' || messageType === 'extendedTextMessage';
}
function getTextContent(message, messageType) {
    if (messageType === 'conversation') {
        return message.message.conversation;
    }
    else if (messageType === 'extendedTextMessage') {
        return message.message.extendedTextMessage.text;
    }
    return '';
}
