import prisma from "../db";
import { logging } from "./producer";

async function getChatHistory(sessionName: string, chatId: string) {
  try {
    const chat = await prisma.chats.findUnique({
      where: {
        userId: sessionName,
        chatId: chatId,
      },
      select: {
        history: true,
      },
    });

    if (!chat) {
      await createChatHistory(sessionName, chatId);
    }

    return chat?.history;
  } catch (error) {
    console.error(error);
    logging("Error getting chat history");
  }
}

async function createChatHistory(
  userId: string,
  chatId: string,
  initialHistory: string = ""
) {
  try {
    const newChat = await prisma.chats.create({
      data: {
        chatId: chatId,
        userId: userId,
        history: initialHistory,
      },
    });
    return newChat;
  } catch (error) {
    console.error(error);
    logging("Error creating chat history");
  }
}

async function updateChatHistory(chatId: string, history: string) {
  try {
    const updatedChat = await prisma.chats.update({
      where: {
        chatId: chatId,
      },
      data: {
        history: history,
      },
    });
    return updatedChat;
  } catch (error) {
    console.error(error);
    throw new Error("Error updating chat history");
  }
}

export { getChatHistory, updateChatHistory };
