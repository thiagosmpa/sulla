import { logging } from "../../kafka/producer";
import { getSession } from "../../whatsapp";

export const sendMessage = (sessionName:string, chatId: string, message: any) => {
  const sock = getSession(sessionName);
  if (!sock) {
    throw new Error(`No active session found for ${sessionName}`);
  }
  try {
    sock.sendMessage(chatId, message);
    logging(`Message sent`);
  } catch (error) {
    logging(`Error sending message: ${error}`);
  }
};
