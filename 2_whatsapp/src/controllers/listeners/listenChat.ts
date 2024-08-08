import { messageProducer } from "../../kafka/producer";
import { logging } from "../../kafka/producer";
import redisClient from "../../redis/client";
import { prisma } from "../../db";

async function updateChatDB(sessionId: string, chatId: string) {
	try {
		await prisma.chat2.upsert({
			where: {
				sessionId_chatId: {
					sessionId: sessionId,
					chatId: chatId,
				},
			},
			create: {
				sessionId: sessionId,
				chatId: chatId,
			},
			update: {
				updatedAt: new Date(),
			},
		});
	} catch (error) {
		console.error("Error during upsert:", error);
	}
}

export async function listenChat(sock: any, sessionId: string) {
	sock.ev.on("chats.upsert", (data: any) => {
		const chat = data.chats[0];
		const chatId = chat.jid;

        console.log(`\n\nChat: ${chat}`)
	});
}