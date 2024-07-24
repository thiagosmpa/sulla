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
exports.startConsumer = void 0;
const kafkajs_1 = require("kafkajs");
const client_1 = __importDefault(require("../redis/client"));
const kafka = new kafkajs_1.Kafka({
    clientId: 'whatsapp-consumer',
    brokers: ['localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'whatsapp-group' });
function startConsumer(sock) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield consumer.connect();
            console.log(`\n\nKafka Consumer connected\n\n`);
            yield consumer.subscribe({ topic: 'whatsapp-messages', fromBeginning: false });
            console.log(`\n\nSubscribed to topic whatsapp-messages\n\n`);
            yield consumer.run({
                eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                    if (message.value) {
                        const chatMessage = JSON.parse(message.value.toString());
                        const chatId = chatMessage.chatId;
                        const messageContent = chatMessage.messageContent;
                        console.log(`\n\nReceived message from Kafka: ${messageContent}\n\n`);
                        yield sock.sendMessage(chatId, { text: messageContent });
                        console.log(`\n\nMessage sent to ${chatId}\n\n`);
                        yield client_1.default.set(chatId, 'bot', { EX: 60 }); // a chave expira em 60 segundos
                        yield consumer.commitOffsets([{ topic, partition, offset: (Number(message.offset) + 1).toString() }]);
                    }
                    else {
                        console.error(`\n\nReceived null message from Kafka\n\n`);
                    }
                })
            });
            process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
                yield consumer.disconnect();
                console.log(`\n\nKafka Consumer disconnected\n\n`);
                process.exit();
            }));
        }
        catch (error) {
            console.error(`\n\nError in Kafka consumer: ${error}\n\n`);
        }
    });
}
exports.startConsumer = startConsumer;
