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
		await prisma.session2.updateMany({ data: { connectionStatus: "server offline" } });
		logging("Kafka Producer connected");
	} catch (error) {
		logging(`Error connecting to Kafka Producer: ${error}`);
	}
	process.on("SIGINT", async () => {
		await prisma.session2.updateMany({ data: { connectionStatus: "server offline" } });
		await producer.disconnect();
		logging("\nKafka Producer disconnected\n");
		process.exit();
	});
};

export async function messageProducer(
	sessionId: string,
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

	
	messageBuffer[chatId].timer = setTimeout(async () => {
		const instructions = (await getInstructions(sessionId)) || "";
		const message = (await getChatHistory(sessionId, chatId)) || "";
		
		console.log(`History: ${message}`);
		await sendMessageToAgent(sessionId, chatId, message, instructions);
		
		messageBuffer[chatId].messages = [];
		messageBuffer[chatId].timer = null;
	}, 15000); // 15 segundos de intervalo
}

export async function sendMessageToAgent(
	sessionId: string,
	chatId: string,
	message: string,
	instructions: string,
) {
	try {
		logging(`Producing message to agent: ${message}`);
		await producer.send({
			topic: "whatsapp-agent-message",
			messages: [
				{
					value: JSON.stringify({
						sessionId,
						chatId,
						message,
						instructions,
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
	const messages = await prisma.message2.findMany({
	  where: {
		sessionId: sessionId,
		from: chatId,
	  },
	  orderBy: {
		updatedAt: 'asc',
	  },
	});
  
	const chatHistory = messages.map(message => ({
	  role: message.from === 'user' ? 'user' : 'system',
	  content: message.content,
	}));
	
	const chatHistoryString = JSON.stringify(chatHistory);

	return chatHistoryString;
  }


async function getInstructions(sessionId: string) {
	try {
		const user = await prisma.session2.findUnique({
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
