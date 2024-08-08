"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const producer_1 = require("../../kafka/producer");
const whatsapp_1 = require("../../whatsapp");
const sendMessage = (sessionId, chatId, message) => {
    const sock = (0, whatsapp_1.getSession)(sessionId);
    if (!sock) {
        throw new Error(`No active session found for ${sessionId}`);
    }
    try {
        sock.sendMessage(chatId, message);
        (0, producer_1.logging)(`Message sent`);
    }
    catch (error) {
        (0, producer_1.logging)(`Error sending message: ${error}`);
    }
};
exports.sendMessage = sendMessage;
