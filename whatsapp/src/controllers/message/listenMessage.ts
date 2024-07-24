import { messageProducer } from "../../kafka/producer";
import redisClient from "../../redis/client";
import { logging } from "../../kafka/producer";
import { sendMessage } from "./sendMessage";

declare global {
  var sockInstance: Sock | undefined;
}

interface Sock {
  ev: {
    on: (event: string, callback: (m: any) => void) => void;
  };
  sendMessage: (chatId: string, message: any) => Promise<void>;
}

interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
  };
  message: any;
}

if (!global.sockInstance) {
  global.sockInstance = undefined;
}

const sessions: Map<string, any> = new Map();

export async function listenMessage(
  sock: any,
  sessionName: string
): Promise<void> {
  sessions.set("sessionName", sessionName);
  if (!global.sockInstance) {
    global.sockInstance = sock;
    sock.ev.on("messages.upsert", async (m: any) => {
      const message: Message = m.messages[0];
      const messageType = getMessageType(message);
      const chatId = message.key.remoteJid;

      // Verificar no Redis se a mensagem foi enviada pelo bot
      const sender = await redisClient.get(chatId);
      const textContent = getTextContent(message, messageType);

      // Filtra as mensagens
      if (sender !== "bot" && isTextMessage(messageType)) {
        // Enviar mensagem ao Kafka
        try {
          await messageProducer(sessionName, chatId, textContent);
          logging(`Producer: ${sessionName}/${chatId}: ${textContent}`);
        } catch (error) {
          logging(`Producer error: ${error}`);
        }
      } else if (sender === "bot") {
        logging(
          `Producer (ignored by bot): ${sessionName}/${chatId}: ${textContent}`
        );
        await redisClient.set(chatId, "", { EX: 60 });
      } else {
        logging(`Producer (ignored): ${sessionName}/${chatId}: ${textContent}`);
      }
    });
  }
}

function getMessageType(message: Message): string {
  return Object.keys(message.message || {})[0];
}

function isGroupMessage(message: Message): boolean {
  return message.key.remoteJid?.includes("@g.us");
}

function isTextMessage(messageType: string): boolean {
  return (
    messageType === "conversation" || messageType === "extendedTextMessage"
  );
}

function isSenderKey(messageType: string): boolean {
  return messageType === "senderKeyDistributionMessage";
}

function canListen(message: Message): boolean {
  return (
    message.key.fromMe ||
    message.key.remoteJid === "553597475292-1556895408@g.us" ||
    message.key.remoteJid === "553591136988@s.whatsapp.net" ||
    message.key.remoteJid === "553591331792@s.whatsapp.net"
  );
}

function getTextContent(message: Message, messageType: string): string {
  if (messageType === "conversation") {
    return message.message.conversation;
  } else if (messageType === "extendedTextMessage") {
    return message.message.extendedTextMessage.text;
  }
  return "";
}
