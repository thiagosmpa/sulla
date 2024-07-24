import { logging } from "../../kafka/producer";
import redisClient from "../../redis/client";

export const sendMessage = (chatId: string, message: any) => {
  if (!global.sockInstance) {
    throw new Error("Sock instance not set");
  }
  try {
    global.sockInstance.sendMessage(chatId, message);
    redisClient.set(chatId, "bot", { EX: 60 }); // reset redis key
    logging(`Message sent`);
  } catch (error) {
    logging(`Error sending message: ${error}`);
  }
};
