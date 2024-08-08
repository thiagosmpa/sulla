"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenMessage = void 0;
const producer_1 = require("../../kafka/producer");
const producer_2 = require("../../kafka/producer");
const client_1 = __importDefault(require("../../redis/client"));
const db_1 = require("../../db");
async function updateMessageDB(sessionId, from, role, type, content) {
    try {
        if (content == "")
            return;
        await db_1.prisma.message2.create({
            data: {
                sessionId: sessionId,
                from: from,
                role: role,
                content: content,
                type: type,
            },
        });
    }
    catch (error) {
        (0, producer_2.logging)(`Error: ${error}`);
    }
}
async function listenMessage(sock, sessionId) {
    sock.ev.on("messages.upsert", async (m) => {
        const message = m.messages[0];
        const messageType = getMessageType(message);
        const from = message.key.remoteJid;
        const role = message.key.fromMe ? "assistant" : "user";
        const sender = await client_1.default.get(`${sessionId}/${from}/sender`);
        const textContent = getTextContent(message, messageType);
        updateMessageDB(sessionId, from, role, messageType, textContent);
        if (sender !== "bot" && isTextMessage(messageType)) {
            try {
                await (0, producer_1.messageProducer)(sessionId, from, textContent);
            }
            catch (error) {
                (0, producer_2.logging)(`Producer error: ${error}`);
            }
        }
        else if (sender === "bot") {
            await client_1.default.del(`${sessionId}/${from}/sender`);
        }
    });
}
exports.listenMessage = listenMessage;
function getMessageType(message) {
    return Object.keys(message.message || {})[0];
}
function isTextMessage(messageType) {
    return messageType === "conversation" || messageType === "extendedTextMessage";
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
