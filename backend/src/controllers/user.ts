import { Request, Response } from "express";
import prisma from "../db";

export const getCurrentUser = async (req: Request, res: Response) => {
  const { id } = req.body;
  try {
    const users = await prisma.users.findUnique({
      where: {
        userId: id,
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
  const { userId } = req.body;
  try {
    const user = await prisma.users.delete({
      where: {
        userId: userId,
      },
    });
    res.status(200).json({
      status: "User Deleted",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { userId, name, agenda, instructions } = req.body;

  const data: { name?: string; agenda?: string; instructions?: string } = {};
  if (name) data.name = name;
  if (agenda) data.agenda = agenda;
  if (instructions) data.instructions = instructions;

  try {
    const user = await prisma.users.update({
      where: { userId: userId },
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

export async function createController(req: Request, res: Response) {
  const { id, name, agenda, instructions } = req.body;

  const findUniqueName = await prisma.users.findUnique({
    where: {
      name: name,
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
          name: name,
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
