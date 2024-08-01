import { messageProducer } from "../../kafka/producer";
import redisClient from "../../redis/client";
import { logging } from "../../kafka/producer";

export async function listenMessage(sock: any, sessionName: string) {
  sock.ev.on("messages.upsert", async (m: any) => {
    console.log(`\n\nReceived message for session ${sessionName}: ${JSON.stringify(m)}\n\n`);
    const message = m.messages[0];
    const messageType = getMessageType(message);
    const chatId = message.key.remoteJid;
    const sender = await redisClient.get(chatId);
    const textContent = getTextContent(message, messageType);

    if (sender !== "bot" && isTextMessage(messageType)) {
      try {
        await messageProducer(sessionName, chatId, textContent);
        logging(`Producer: ${sessionName}/${chatId}: ${textContent}`);
      } catch (error) {
        logging(`Producer error: ${error}`);
      }
    } else if (sender === "bot") {
      logging(`Producer (ignored by bot): ${sessionName}/${chatId}: ${textContent}`);
      await redisClient.set(chatId, "", { EX: 60 });
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