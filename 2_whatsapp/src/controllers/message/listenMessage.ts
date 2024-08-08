import { messageProducer } from "../../kafka/producer";
import { logging } from "../../kafka/producer";
import redisClient from "../../redis/client";
import { prisma } from "../../db";

async function updateMessageDB(
	sessionId: string,
	from: string,
	role: string,
	type: string,
	content: string,
) {
	try {
		if (content == "") return;

		await prisma.message2.create({
			data: {
				sessionId: sessionId,
				from: from,
				role: role,
				content: content,
				type: type,
			},
		});
	} catch (error: any) {
		logging(`Error: ${error}`);
	}
}

export async function listenMessage(sock: any, sessionId: string) {
	sock.ev.on("messages.upsert", async (m: any) => {
		const message = m.messages[0];
		const messageType = getMessageType(message);
		const from = message.key.remoteJid;
		const role = message.key.fromMe ? "assistant" : "user";
		const sender = await redisClient.get(`${sessionId}/${from}/sender`);
		const textContent = getTextContent(message, messageType);

		updateMessageDB(sessionId, from, role, messageType, textContent);

		if (sender !== "bot" && isTextMessage(messageType)) {
			try {
				await messageProducer(sessionId, from, textContent);
			} catch (error) {
				logging(`Producer error: ${error}`);
			}
		} else if (sender === "bot") {
			await redisClient.del(`${sessionId}/${from}/sender`);
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
