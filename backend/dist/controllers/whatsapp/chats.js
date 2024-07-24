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
exports.getAllChats = void 0;
const db_1 = __importDefault(require("../../db"));
const getAllChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        const chats = yield db_1.default.chats.findMany({
            where: {
                userId: userId,
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                chats,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            error: error,
        });
    }
});
exports.getAllChats = getAllChats;
