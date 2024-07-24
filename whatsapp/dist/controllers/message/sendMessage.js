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
exports.sendMessage = void 0;
const baileys_1 = require("@whiskeysockets/baileys");
const targetId = '553597475292-1556895408@g.us';
const messageContent = { text: 'Test message' };
const sendMessage = (sock) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sock.presenceSubscribe(targetId);
        yield (0, baileys_1.delay)(500);
        yield sock.sendPresenceUpdate('composing', targetId);
        yield (0, baileys_1.delay)(2000);
        yield sock.sendPresenceUpdate('paused', targetId);
        const sentMessage = yield sock.sendMessage(targetId, messageContent);
        // console.log('Message sent successfully:', sentMessage)
    }
    catch (error) {
        console.error('Failed to send message:', error);
    }
});
exports.sendMessage = sendMessage;
