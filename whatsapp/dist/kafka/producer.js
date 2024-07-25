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
exports.connectProducer = exports.producer = void 0;
exports.messageProducer = messageProducer;
exports.agentRequestProducer = agentRequestProducer;
exports.logging = logging;
const kafkajs_1 = require("kafkajs");
const moment_1 = __importDefault(require("moment"));
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new kafkajs_1.Kafka({
    clientId: "whatsapp-producer",
    brokers: [kafkaBroker],
});
exports.producer = kafka.producer();
const messageBuffer = {};
function sendToKafka(sessionName, chatId, messageContent) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.producer.send({
            topic: "whatsapp-messages",
            messages: [
                {
                    key: chatId,
                    value: JSON.stringify({ sessionName, chatId, messageContent }),
                },
            ],
        });
    });
}
const connectProducer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.producer.connect();
        logging("Kafka Producer connected");
    }
    catch (error) {
        logging(`Error connecting to Kafka Producer: ${error}`);
    }
    process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
        yield exports.producer.disconnect();
        logging("\nKafka Producer disconnected\n");
        process.exit();
    }));
});
exports.connectProducer = connectProducer;
function messageProducer(sessionName, chatId, messageContent) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!messageBuffer[chatId]) {
            messageBuffer[chatId] = {
                messages: [],
                timer: null,
            };
        }
        messageBuffer[chatId].messages.push(messageContent);
        if (messageBuffer[chatId].timer !== null) {
            clearTimeout(messageBuffer[chatId].timer);
        }
        messageBuffer[chatId].timer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            const combinedMessage = messageBuffer[chatId].messages.join("\n");
            yield sendToKafka(sessionName, chatId, combinedMessage);
            messageBuffer[chatId].messages = [];
            messageBuffer[chatId].timer = null;
        }), 15000); // 15 segundos de intervalo
    });
}
function agentRequestProducer(sessionName, chatId, message, history, instructions) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logging(`Producing message to agent: ${message}`);
            yield exports.producer.send({
                topic: "agent-request",
                messages: [
                    {
                        value: JSON.stringify({
                            sessionName,
                            chatId,
                            history,
                            instructions,
                            message,
                        }),
                    },
                ],
            });
        }
        catch (error) {
            logging(`Error producing message to agent: ${error}`);
        }
    });
}
function logging(log) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = (0, moment_1.default)().format("YYYY-MM-DD HH:mm:ss");
        console.log(`\n${now}:${log}\n`);
        const logMessage = `${now}: ${log}`;
        yield exports.producer.send({
            topic: "logs",
            messages: [{ value: JSON.stringify({ Whatsapp: logMessage }) }],
        });
    });
}
