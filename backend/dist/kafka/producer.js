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
exports.producer = exports.connectProducer = exports.sendMessage = void 0;
exports.logging = logging;
const kafkajs_1 = require("kafkajs");
const moment_1 = __importDefault(require("moment"));
const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafka = new kafkajs_1.Kafka({
    clientId: 'whatsapp-producer',
    brokers: [kafkaBroker]
});
const producer = kafka.producer();
exports.producer = producer;
const connectProducer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield producer.connect();
    logging('Kafka Producer connected');
    process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
        yield producer.disconnect();
        logging('Kafka Producer disconnected');
        process.exit();
    }));
});
exports.connectProducer = connectProducer;
function logging(log) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = (0, moment_1.default)().format('YYYY-MM-DD HH:mm:ss');
        console.log(`\n${now}: ${log}\n`);
        const logMessage = `${now}:${log}`;
        yield producer.send({
            topic: 'logs',
            messages: [
                { value: JSON.stringify({ Backend: logMessage }) }
            ]
        });
    });
}
const sendMessage = (topic, messages) => __awaiter(void 0, void 0, void 0, function* () {
    yield producer.send({ topic, messages });
});
exports.sendMessage = sendMessage;
