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
exports.getChatHistory = getChatHistory;
exports.updateChatHistory = updateChatHistory;
const db_1 = __importDefault(require("../db"));
const producer_1 = require("./producer");
function getChatHistory(sessionName, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chat = yield db_1.default.chats.findUnique({
                where: {
                    userId: sessionName,
                    chatId: chatId,
                },
                select: {
                    history: true,
                },
            });
            if (!chat) {
                yield createChatHistory(sessionName, chatId);
            }
            return chat === null || chat === void 0 ? void 0 : chat.history;
        }
        catch (error) {
            console.error(error);
            (0, producer_1.logging)("Error getting chat history");
        }
    });
}
function createChatHistory(userId_1, chatId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, chatId, initialHistory = "") {
        try {
            const newChat = yield db_1.default.chats.create({
                data: {
                    chatId: chatId,
                    userId: userId,
                    history: initialHistory,
                },
            });
            return newChat;
        }
        catch (error) {
            console.error(error);
            (0, producer_1.logging)("Error creating chat history");
        }
    });
}
function updateChatHistory(chatId, history) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const updatedChat = yield db_1.default.chats.update({
                where: {
                    chatId: chatId,
                },
                data: {
                    history: history,
                },
            });
            return updatedChat;
        }
        catch (error) {
            console.error(error);
            throw new Error("Error updating chat history");
        }
    });
}
