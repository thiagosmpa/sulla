"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectConsumer = exports.startConsumer = void 0;
const kafkajs_1 = require("kafkajs");
const producer_1 = require("./producer");
const sendMessage_1 = require("../controllers/message/sendMessage");
const client_1 = __importDefault(require("../redis/client"));
const agentURL = process.env.agentURL || "http://localhost:18070";
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new kafkajs_1.Kafka({
    clientId: "whatsapp",
    brokers: [kafkaBroker],
});
const consumer = kafka.consumer({ groupId: "whatsapp-group" });
function processAgentResponse(data) {
    try {
        const agentResponse = JSON.parse(data.value.toString());
        const agentMessage = agentResponse.message;
        const history = agentResponse.history;
        const sessionId = agentResponse.sessionId;
        const chatId = agentResponse.chatId;
        client_1.default.set(`${sessionId}/${chatId}/sender`, "bot", { EX: 60 });
        (0, producer_1.logging)(`Consuming Agent Response: ${sessionId}/${chatId}:${agentMessage}`);
        (0, sendMessage_1.sendMessage)(sessionId, chatId, { text: agentMessage });
    }
    catch (error) {
        (0, producer_1.logging)(`Error processing agent response: ${error}`);
    }
}
async function startConsumer() {
    try {
        await consumer.subscribe({
            topic: "whatsapp-agent-message",
            fromBeginning: false,
        });
        await consumer.subscribe({
            topic: "agent-whatsapp-message",
            fromBeginning: false,
        });
        (0, producer_1.logging)("Subscribed to topics \n- whatsapp-agent-message,\n- agent-whatsapp-message");
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (message.value) {
                    if (topic === "agent-whatsapp-message") {
                        processAgentResponse(message);
                    }
                }
                else {
                    (0, producer_1.logging)("Consuming Message: null");
                }
            },
        });
        process.on("SIGINT", async () => {
            await consumer.disconnect();
            (0, producer_1.logging)("Kafka Consumer disconnected");
            process.exit();
        });
    }
    catch (error) {
        (0, producer_1.logging)(`Error in Kafka consumer: ${error}`);
    }
}
exports.startConsumer = startConsumer;
const connectConsumer = async () => {
    try {
        await consumer.connect();
        (0, producer_1.logging)("Kafka Consumer connected");
    }
    catch (error) {
        (0, producer_1.logging)(`Error connecting to Kafka Consumer: ${error}`);
    }
    process.on("SIGINT", async () => {
        await consumer.disconnect();
        (0, producer_1.logging)("Kafka Consumer disconnected");
        process.exit();
    });
};
exports.connectConsumer = connectConsumer;
