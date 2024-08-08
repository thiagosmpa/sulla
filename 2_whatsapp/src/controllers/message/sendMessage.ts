import { logging } from "../../kafka/producer";
import { getSession } from "../../whatsapp";

export const sendMessage = (sessionId:string, chatId: string, message: any) => {
  const sock = getSession(sessionId);
  if (!sock) {
    throw new Error(`No active session found for ${sessionId}`);
  }
  try {
    sock.sendMessage(chatId, message);
    logging(`Message sent`);
  } catch (error) {
    logging(`Error sending message: ${error}`);
  }
};
