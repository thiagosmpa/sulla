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
exports.connectConsumer = void 0;
exports.startConsumer = startConsumer;
const kafkajs_1 = require("kafkajs");
const sendMessage_1 = require("../controllers/message/sendMessage");
const whatsapp_1 = require("../controllers/whatsapp");
const producer_1 = require("./producer");
const chatHistory_1 = require("./chatHistory");
const instructions_1 = require("./instructions");
const client_1 = __importDefault(require("../redis/client"));
const agentURL = process.env.agentURL || "http://localhost:18070";
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new kafkajs_1.Kafka({
    clientId: "whatsapp",
    brokers: [kafkaBroker],
});
const consumer = kafka.consumer({ groupId: "whatsapp-group" });
function processMessage(message, topic, partition) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const chatMessage = JSON.parse(message.value.toString());
        const sessionName = chatMessage.sessionName;
        const chatId = chatMessage.chatId;
        const messageContent = chatMessage.messageContent;
        (0, producer_1.logging)(`Consuming Message: ${sessionName}/${chatId}:${messageContent}`);
        try {
            const chatHistory = (_a = (yield (0, chatHistory_1.getChatHistory)(sessionName, chatId))) !== null && _a !== void 0 ? _a : "";
            (0, producer_1.logging)(`Chat History: ${chatHistory}`);
            const instructions = (_b = (yield (0, instructions_1.getInstructions)(sessionName))) !== null && _b !== void 0 ? _b : "";
            (0, producer_1.logging)(`Instructions: ${instructions}`);
            (0, producer_1.agentRequestProducer)(sessionName, chatId, messageContent, chatHistory, instructions);
            yield client_1.default.set(chatId, "bot", { EX: 60 }); // a chave expira em 60 segundos
            yield consumer.commitOffsets([
                { topic, partition, offset: (Number(message.offset) + 1).toString() },
            ]);
        }
        catch (error) {
            (0, producer_1.logging)(`Error sending message to agent: ${error}`);
        }
    });
}
function processAgentResponse(data) {
    const agentResponse = JSON.parse(data.value.toString());
    const agentMessage = agentResponse.message;
    const history = agentResponse.history;
    const sessionName = agentResponse.sessionName;
    const chatId = agentResponse.chatId;
    (0, producer_1.logging)(`Consuming Agent Response: ${sessionName}/${chatId}:${agentMessage}`);
    (0, chatHistory_1.getChatHistory)(sessionName, chatId);
    (0, chatHistory_1.updateChatHistory)(chatId, history);
    (0, producer_1.logging)(`Agent Response: ${agentMessage}`);
    (0, producer_1.logging)(`Updated History: ${history}`);
    (0, sendMessage_1.sendMessage)(chatId, { text: agentMessage });
}
function processConnection(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionMessage = JSON.parse(message.value.toString());
        const sessionName = sessionMessage.id;
        (0, whatsapp_1.connectSession)(sessionName);
    });
}
function startConsumer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield consumer.subscribe({
                topic: "whatsapp-messages",
                fromBeginning: false,
            });
            yield consumer.subscribe({
                topic: "whatsapp-connection",
                fromBeginning: false,
            });
            yield consumer.subscribe({
                topic: "agent-response",
                fromBeginning: false,
            });
            (0, producer_1.logging)("Subscribed to topics \n- whatsapp-messages,\n- whatsapp-connection,\n- agent-response");
            yield consumer.run({
                eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                    if (message.value) {
                        if (topic === "whatsapp-messages") {
                            processMessage(message, topic, partition);
                        }
                        else if (topic === "whatsapp-connection") {
                            if ((yield client_1.default.get(message.value.toString())) === "sent") {
                                (0, producer_1.logging)(`Session ${message.value.toString()} already sent`);
                                return;
                            }
                            yield client_1.default.set(message.value.toString(), "sent", { EX: 20 });
                            (0, producer_1.logging)(`Connecting to Session Name: ${message.value.toString()}`);
                            processConnection(message);
                        }
                        else if (topic === "agent-response") {
                            processAgentResponse(message);
                        }
                    }
                    else {
                        (0, producer_1.logging)("Consuming Message: null");
                    }
                }),
            });
            process.on("SIGINT", () => __awaiter(this, void 0, void 0, function* () {
                yield consumer.disconnect();
                (0, producer_1.logging)("Kafka Consumer disconnected");
                process.exit();
            }));
        }
        catch (error) {
            (0, producer_1.logging)(`Error in Kafka consumer: ${error}`);
        }
    });
}
const connectConsumer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield consumer.connect();
        (0, producer_1.logging)("Kafka Consumer connected");
    }
    catch (error) {
        (0, producer_1.logging)(`Error connecting to Kafka Consumer: ${error}`);
    }
    process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
        yield consumer.disconnect();
        (0, producer_1.logging)("Kafka Consumer disconnected");
        process.exit();
    }));
});
exports.connectConsumer = connectConsumer;
