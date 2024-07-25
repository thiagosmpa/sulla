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
exports.getInstructions = getInstructions;
const producer_1 = require("./producer");
const db_1 = __importDefault(require("../db"));
function getInstructions(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield db_1.default.users.findUnique({
                where: {
                    userId: userId,
                },
                select: {
                    instructions: true,
                },
            });
            return user === null || user === void 0 ? void 0 : user.instructions;
        }
        catch (error) {
            console.error(error);
            (0, producer_1.logging)("Error getting instructions");
        }
    });
}
