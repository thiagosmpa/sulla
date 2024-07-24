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
exports.connect = void 0;
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const connect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    const socket = (0, socket_io_client_1.default)(process.env.WHATSAPP_SERVER_URL || 'http://localhost:3002/');
    socket.emit('stabilish_connection', {
        'id': id
    });
    socket.on('connection_stabilished', (data) => {
        console.log(data);
    });
    res.status(200).send('Conectado');
});
exports.connect = connect;
