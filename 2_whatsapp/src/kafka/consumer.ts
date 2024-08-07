import { Kafka } from "kafkajs";
import { logging } from "./producer";
import { prisma } from "../db";
import { sendMessageToAgent } from "./producer";
import { sendMessage } from "../controllers/message/sendMessage";
import redisClient from "../redis/client";

const agentURL = process.env.agentURL || "http://localhost:18070";
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
	clientId: "whatsapp",
	brokers: [kafkaBroker],
});

const consumer = kafka.consumer({ groupId: "whatsapp-group" });

async function getInstructions(sessionId: string) {
	try {
		const user = await prisma.users.findUnique({
			where: {
				sessionId: sessionId,
			},
			select: {
				instructions: true,
			},
		});
		return user?.instructions;
	} catch (error) {
		console.error(error);
		logging("Error getting instructions");
	}
}

async function getChatHistory(sessionName: string, chatId: string) {
	try {
		const chat = await prisma.chat2.findFirst({
			where: {
				sessionId: sessionName,
				chatId: chatId,
			},
			select: {
				history: true,
			},
		});

		if (!chat) {
			await createChatHistory(sessionName, chatId);
		}

		return chat?.history;
	} catch (error) {
		console.error(error);
		logging("Error getting chat history");
	}
}

async function createChatHistory(sessionId: string, chatId: string, initialHistory: string = "") {
	try {
		const newChat = await prisma.chat2.create({
			data: {
				chatId: chatId,
				sessionId: sessionId,
				history: initialHistory,
			},
		});
		return newChat;
	} catch (error) {
		console.error(error);
		logging("Error creating chat history");
	}
}

async function updateChatHistory(chatId: string, history: string) {
	try {
		const updatedChat = await prisma.chat2.update({
			where: {
				chatId: chatId,
			},
			data: {
				history: history,
			},
		});
		return updatedChat;
	} catch (error) {
		console.error(error);
		throw new Error("Error updating chat history");
	}
}

async function processMessage(message: any, topic: any, partition: any): Promise<void> {
	const chatMessage = JSON.parse(message.value.toString());
	const sessionName = chatMessage.sessionName;
	const chatId = chatMessage.chatId;
	const messageContent = chatMessage.messageContent;
	logging(`Consuming Message: ${sessionName}/${chatId}:${messageContent}`);

	try {
		const chatHistory = (await getChatHistory(sessionName, chatId)) ?? "";
		logging(`Chat History: ${chatHistory}`);
		const instructions = (await getInstructions(sessionName)) ?? "";
		logging(`Instructions: ${instructions}`);

		sendMessageToAgent(sessionName, chatId, messageContent, chatHistory, instructions);
		
		await redisClient.set(`${sessionName}/${chatId}/sender`, "bot", {EX: 60});

		await consumer.commitOffsets([
			{ topic, partition, offset: (Number(message.offset) + 1).toString() },
		]);
	} catch (error) {
		logging(`Error sending message to agent: ${error}`);
	}
}

function processAgentResponse(data: any) {
	const agentResponse = JSON.parse(data.value.toString());
	const agentMessage = agentResponse.message;
	const history = agentResponse.history;
	const sessionName = agentResponse.sessionName;
	const chatId = agentResponse.chatId;
	redisClient.set(`${sessionName}/${chatId}/sender`, "bot", {EX: 60});

	logging(`Consuming Agent Response: ${sessionName}/${chatId}:${agentMessage}`);
	// getChatHistory(sessionName, chatId);
	// updateChatHistory(chatId, history);
	logging(`Agent Response: ${agentMessage}`);
	logging(`Updated History: ${history}`);

	sendMessage(sessionName, chatId, { text: agentMessage });
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
