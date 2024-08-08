"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logging = exports.sendMessageToAgent = exports.messageProducer = exports.connectProducer = exports.producer = void 0;
const kafkajs_1 = require("kafkajs");
const moment_1 = __importDefault(require("moment"));
const db_1 = require("../db");
// const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafkaBroker = "localhost:9092";
const kafka = new kafkajs_1.Kafka({
    clientId: "whatsapp-producer",
    brokers: [kafkaBroker],
});
exports.producer = kafka.producer();
const messageBuffer = {};
const connectProducer = async () => {
    try {
        await exports.producer.connect();
        await db_1.prisma.session2.updateMany({ data: { connectionStatus: "server offline" } });
        logging("Kafka Producer connected");
    }
    catch (error) {
        logging(`Error connecting to Kafka Producer: ${error}`);
    }
    process.on("SIGINT", async () => {
        await db_1.prisma.session2.updateMany({ data: { connectionStatus: "server offline" } });
        await exports.producer.disconnect();
        logging("\nKafka Producer disconnected\n");
        process.exit();
    });
};
exports.connectProducer = connectProducer;
async function messageProducer(sessionId, chatId, messageContent) {
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
    messageBuffer[chatId].timer = setTimeout(async () => {
        const instructions = (await getInstructions(sessionId)) || "";
        const message = (await getChatHistory(sessionId, chatId)) || "";
        console.log(`History: ${message}`);
        await sendMessageToAgent(sessionId, chatId, message, instructions);
        messageBuffer[chatId].messages = [];
        messageBuffer[chatId].timer = null;
    }, 15000); // 15 segundos de intervalo
}
exports.messageProducer = messageProducer;
async function sendMessageToAgent(sessionId, chatId, message, instructions) {
    try {
        logging(`Producing message to agent: ${message}`);
        await exports.producer.send({
            topic: "whatsapp-agent-message",
            messages: [
                {
                    value: JSON.stringify({
                        sessionId,
                        chatId,
                        message,
                        instructions,
                    }),
                },
            ],
        });
    }
    catch (error) {
        logging(`Error producing message to agent: ${error}`);
    }
}
exports.sendMessageToAgent = sendMessageToAgent;
async function logging(log) {
    const now = (0, moment_1.default)().format("YYYY-MM-DD HH:mm:ss");
    console.log(`\n${now}:${log}\n`);
    const logMessage = `${now}: ${log}`;
    await exports.producer.send({
        topic: "logs",
        messages: [{ value: JSON.stringify({ Whatsapp: logMessage }) }],
    });
}
exports.logging = logging;
async function getChatHistory(sessionId, chatId) {
    const messages = await db_1.prisma.message2.findMany({
        where: {
            sessionId: sessionId,
            from: chatId,
        },
        orderBy: {
            updatedAt: 'asc',
        },
    });
    const chatHistory = messages.map(message => ({
        role: message.from === 'user' ? 'user' : 'system',
        content: message.content,
    }));
    const chatHistoryString = JSON.stringify(chatHistory);
    return chatHistoryString;
}
async function getInstructions(sessionId) {
    try {
        const user = await db_1.prisma.session2.findUnique({
            where: {
                sessionId: sessionId,
            },
        });
        return user === null || user === void 0 ? void 0 : user.instructions;
    }
    catch (error) {
        console.error(error);
        logging("Error getting chat instructions");
    }
}
