import { logging } from "./producer";
import prisma from "../db";

async function getInstructions(userId: string) {
  try {
    const user = await prisma.users.findUnique({
      where: {
        userId: userId,
      },
      select: {
        instructions: true,
      },
    });
    return user?.instructions;
  } catch (error) {
    console.error(error);
    logging("Error getting instructions");
  }
}

export { getInstructions };
