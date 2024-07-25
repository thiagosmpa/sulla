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
exports.connect = void 0;
const producer_1 = require("../../kafka/producer");
const producer_2 = require("../../kafka/producer");
const connect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    try {
        yield (0, producer_1.sendMessage)('whatsapp-connection', [{ key: id, value: JSON.stringify({ id }) }]);
        (0, producer_2.logging)(`Connection request: ${id}`);
        res.status(200).send('Conectado');
    }
    catch (error) {
        (0, producer_2.logging)(`Error connecting: ${id}: ${error}`);
        res.status(500).send('Erro ao conectar');
    }
});
exports.connect = connect;
