import { Kafka } from "kafkajs";
import { logging } from "./producer";
import { prisma } from "../db";
import { sendMessage } from "../controllers/message/sendMessage";
import redisClient from "../redis/client";

const agentURL = process.env.agentURL || "http://localhost:18070";
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
	clientId: "whatsapp",
	brokers: [kafkaBroker],
});

const consumer = kafka.consumer({ groupId: "whatsapp-group" });

function processAgentResponse(data: any) {
	try {
		const agentResponse = JSON.parse(data.value.toString());
		const agentMessage = agentResponse.message;
		const history = agentResponse.history;
		const sessionId = agentResponse.sessionId;
		const chatId = agentResponse.chatId;
		redisClient.set(`${sessionId}/${chatId}/sender`, "bot", {EX: 60});
	
		logging(`Consuming Agent Response: ${sessionId}/${chatId}:${agentMessage}`);
	
		sendMessage(sessionId, chatId, { text: agentMessage });
	} catch (error: any) {
		logging(`Error processing agent response: ${error}`);
	}
}

async function startConsumer(): Promise<void> {
	try {
		await consumer.subscribe({
			topic: "whatsapp-agent-message",
			fromBeginning: false,
		});
		await consumer.subscribe({
			topic: "agent-whatsapp-message",
			fromBeginning: false,
		});
		logging("Subscribed to topics \n- whatsapp-agent-message,\n- agent-whatsapp-message");

		await consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				if (message.value) {
					if (topic === "agent-whatsapp-message") {
						processAgentResponse(message);
					}
				} else {
					logging("Consuming Message: null");
				}
			},
		});

		process.on("SIGINT", async () => {
			await consumer.disconnect();
			logging("Kafka Consumer disconnected");
			process.exit();
		});
	} catch (error) {
		logging(`Error in Kafka consumer: ${error}`);
	}
}

const connectConsumer = async () => {
	try {
		await consumer.connect();
		logging("Kafka Consumer connected");
	} catch (error) {
		logging(`Error connecting to Kafka Consumer: ${error}`);
	}

	process.on("SIGINT", async () => {
		await consumer.disconnect();
		logging("Kafka Consumer disconnected");
		process.exit();
	});
};

export { startConsumer, connectConsumer };
