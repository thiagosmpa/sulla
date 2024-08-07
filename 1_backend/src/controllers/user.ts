import { Request, Response } from "express";
import prisma from "../db";

export const getCurrentUser = async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  try {
    const users = await prisma.users.findUnique({
      where: {
        sessionId: sessionId,
      },
    });
    res.status(200).json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  try {
    // Contact, GroupMetadata, Message, Session, Users, Chat2
    await prisma.session.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    await prisma.users.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    await prisma.chat.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    await prisma.contact.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    await prisma.groupMetadata.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    await prisma.message.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    await prisma.chat2.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });
    res.status(200).json({
      status: "User Deleted",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};
export const updateUser = async (req: Request, res: Response) => {
  const { sessionId, agenda, instructions } = req.body;

  const data: { name?: string; agenda?: string; instructions?: string } = {};
  if (agenda) data.agenda = agenda;
  if (instructions) data.instructions = instructions;

  try {
    const user = await prisma.users.update({
      where: { sessionId: sessionId },
      data: data,
    });
    res.status(200).json({
      status: "User Updated",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany();
    res.status(200).json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error,
    });
  }
};

export async function createUser(req: Request, res: Response) {
  const { sessionName, agenda, instructions } = req.body;

  const findUniqueName = await prisma.users.findUnique({
    where: {
      name: sessionName,
    },
  });
  if (findUniqueName !== null) {
    return res.status(400).json({
      status: "error",
      message: "User already exists",
    });
  } else {
    try {
      const user = await prisma.users.create({
        data: {
          name: sessionName,
          agenda: agenda,
          instructions: instructions,
          connectionStatus: "offline",
        },
      });
      res.status(200).json({
        status: "User Created",
        user,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
}
