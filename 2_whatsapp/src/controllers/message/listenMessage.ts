import { messageProducer } from "../../kafka/producer";
import { logging } from "../../kafka/producer";
import redisClient from "../../redis/client";
import { prisma } from "../../db";
import { message } from "@/controllers";

async function updateMessageDB(
	sessionId: string,
	chatId: string,
	from: string,
	type: string,
	message: string,
) {
	await prisma.message2.upsert({
		where: {
			sessionId: sessionId,
			chatId: chatId,
		},
		create: {
			sessionId: sessionId,
			chatId: chatId,
			from: from,
			type: type,
			message: message,
		},
		update: {
			from: from,
			type: type,
			message: message,
		},
	});
}

export async function listenMessage(sock: any, sessionName: string) {
	sock.ev.on("messages.upsert", async (m: any) => {
		const message = m.messages[0];
		const messageType = getMessageType(message);
		const chatId = message.key.remoteJid;
		const from = message.key.fromMe ? "system" : "user";
		const sender = await redisClient.get(`${sessionName}/${chatId}/sender`);
		const textContent = getTextContent(message, messageType);

		updateMessageDB(sessionName, chatId, from, messageType, textContent);

		if (sender !== "bot" && isTextMessage(messageType)) {
			try {
				await messageProducer(sessionName, chatId, textContent);
			} catch (error) {
				logging(`Producer error: ${error}`);
			}
		} else if (sender === "bot") {
			logging(`Producer (ignored by bot): ${sessionName}/${chatId}: ${textContent}`);
			await redisClient.del(`${sessionName}/${chatId}/sender`);
		} else {
			logging(`Producer (ignored): ${sessionName}/${chatId}: ${textContent}`);
		}
	});
}

function getMessageType(message: any): string {
	return Object.keys(message.message || {})[0];
}

function isTextMessage(messageType: string): boolean {
	return messageType === "conversation" || messageType === "extendedTextMessage";
}

function getTextContent(message: any, messageType: string): string {
	if (messageType === "conversation") {
		return message.message.conversation;
	} else if (messageType === "extendedTextMessage") {
		return message.message.extendedTextMessage.text;
	}
	return "";
}
