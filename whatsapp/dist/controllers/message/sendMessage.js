"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const producer_1 = require("../../kafka/producer");
const client_1 = __importDefault(require("../../redis/client"));
const sendMessage = (chatId, message) => {
    if (!global.sockInstance) {
        throw new Error("Sock instance not set");
    }
    try {
        global.sockInstance.sendMessage(chatId, message);
        client_1.default.set(chatId, "bot", { EX: 60 }); // reset redis key
        (0, producer_1.logging)(`Message sent`);
    }
    catch (error) {
        (0, producer_1.logging)(`Error sending message: ${error}`);
    }
};
exports.sendMessage = sendMessage;
