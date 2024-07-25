"use strict";
// BACKEND
// PORT 3001
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
const express_1 = __importDefault(require("express"));
const producer_1 = require("./kafka/producer");
const user_1 = __importDefault(require("./routes/user"));
const group_1 = __importDefault(require("./routes/group"));
const professional_1 = __importDefault(require("./routes/professional"));
const auth_1 = __importDefault(require("./routes/auth"));
const connection_1 = __importDefault(require("./routes/whatsapp/connection"));
const chats_1 = __importDefault(require("./routes/whatsapp/chats"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.get('/', (req, res) => {
    res.send('Hello World from backend server!');
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, producer_1.connectProducer)();
}))();
app.use('/api', user_1.default);
app.use('/api', group_1.default);
app.use('/api', chats_1.default);
app.use('/api', professional_1.default);
app.use('/api', auth_1.default);
app.use('/api', connection_1.default);
exports.default = app;
