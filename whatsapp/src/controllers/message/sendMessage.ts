import { logging } from "../../kafka/producer";
import redisClient from "../../redis/client";
import { getSessionSocket } from "../whatsapp";

export const sendMessage = (sessionName:string, chatId: string, message: any) => {
  const sock = getSessionSocket(sessionName);
  if (!sock) {
    throw new Error(`No active session found for ${sessionName}`);
  }
  try {
    sock.sendMessage(chatId, message);
    redisClient.set(chatId, "bot", { EX: 60 }); // reset redis key
    logging(`Message sent`);
  } catch (error) {
    logging(`Error sending message: ${error}`);
  }
};
