import { Kafka } from "kafkajs";
import moment from "moment";
import { prisma } from "../db";

// const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafkaBroker = "localhost:9092";

const kafka = new Kafka({
	clientId: "whatsapp-producer",
	brokers: [kafkaBroker],
});

export const producer = kafka.producer();

interface MessageBuffer {
	messages: string[];
	timer: NodeJS.Timeout | null;
}

const messageBuffer: { [key: string]: MessageBuffer } = {};

export const connectProducer = async () => {
	try {
		await producer.connect();
		await prisma.users.updateMany({ data: { connectionStatus: "server offline" } });
		logging("Kafka Producer connected");
	} catch (error) {
		logging(`Error connecting to Kafka Producer: ${error}`);
	}
	process.on("SIGINT", async () => {
		await prisma.users.updateMany({ data: { connectionStatus: "server offline" } });
		await producer.disconnect();
		logging("\nKafka Producer disconnected\n");
		process.exit();
	});
};

export async function messageProducer(
	sessionName: string,
	chatId: string,
	messageContent: string,
): Promise<void> {
	if (!messageBuffer[chatId]) {
		messageBuffer[chatId] = {
			messages: [],
			timer: null,
		};
	}
	messageBuffer[chatId].messages.push(messageContent);

	if (messageBuffer[chatId].timer !== null) {
		clearTimeout(messageBuffer[chatId].timer!);
	}

	const history = (await getChatHistory(sessionName, chatId)) || "";
	const instructions = (await getInstructions(sessionName)) || "";

	messageBuffer[chatId].timer = setTimeout(async () => {
		const combinedMessage = messageBuffer[chatId].messages.join("\n");
		await sendMessageToAgent(sessionName, chatId, combinedMessage, history, instructions);
		messageBuffer[chatId].messages = [];
		messageBuffer[chatId].timer = null;
	}, 15000); // 15 segundos de intervalo
}

export async function sendMessageToAgent(
	sessionName: string,
	chatId: string,
	message: string,
	history: any,
	instructions: string,
) {
	try {
		logging(`Producing message to agent: ${message}`);
		await producer.send({
			topic: "whatsapp-agent-message",
			messages: [
				{
					value: JSON.stringify({
						sessionName,
						chatId,
						history,
						instructions,
						message,
					}),
				},
			],
		});
	} catch (error) {
		logging(`Error producing message to agent: ${error}`);
	}
}

export async function logging(log: string): Promise<void> {
	const now = moment().format("YYYY-MM-DD HH:mm:ss");

	console.log(`\n${now}:${log}\n`);

	const logMessage = `${now}: ${log}`;
	await producer.send({
		topic: "logs",
		messages: [{ value: JSON.stringify({ Whatsapp: logMessage }) }],
	});
}

async function getChatHistory(sessionId: string, chatId: string) {
	try {
		const chat = await prisma.chat2.findFirst({
			where: {
				sessionId: sessionId,
				chatId: chatId,
			},
		});
		return chat?.history;
	} catch (error) {
		console.error(error);
		logging("Error getting chat history");
	}
}

async function getInstructions(sessionId: string) {
	try {
		const user = await prisma.users.findUnique({
			where: {
				sessionId: sessionId,
			},
		});
		return user?.instructions;
	} catch (error) {
		console.error(error);
		logging("Error getting chat instructions");
	}
}
