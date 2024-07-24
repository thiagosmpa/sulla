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
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageQueue = exports.producer = void 0;
const kafkajs_1 = require("kafkajs");
const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafka = new kafkajs_1.Kafka({
    clientId: 'whatsapp-producer',
    brokers: [kafkaBroker]
});
exports.producer = kafka.producer();
// Buffer para armazenar mensagens
const messageBuffer = {};
function messageQueue(chatId, messageContent) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!messageBuffer[chatId]) {
            messageBuffer[chatId] = {
                messages: [],
                timer: null
            };
        }
        messageBuffer[chatId].messages.push(messageContent);
        if (messageBuffer[chatId].timer !== null) {
            clearTimeout(messageBuffer[chatId].timer);
        }
        messageBuffer[chatId].timer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const combinedMessage = messageBuffer[chatId].messages.join('\n');
            yield sendToKafka(chatId, combinedMessage);
            messageBuffer[chatId].messages = [];
            messageBuffer[chatId].timer = null;
        }), 20000); // 20 segundos de intervalo
    });
}
exports.messageQueue = messageQueue;
function sendToKafka(chatId, messageContent) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.producer.send({
            topic: 'whatsapp-messages',
            messages: [
                { key: chatId, value: JSON.stringify({ chatId, messageContent }) }
            ]
        });
    });
}
// Manter a conexão ativa
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.producer.connect();
    console.log('\n\nKafka Producer connected\n\n');
    process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
        yield exports.producer.disconnect();
        console.log('\n\nKafka Producer disconnected\n\n');
        process.exit();
    }));
}))();
