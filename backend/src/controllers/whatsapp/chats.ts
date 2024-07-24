import { Request, Response } from 'express';
import prisma from '../../db';

export const getAllChats = async (req: Request, res: Response) => {
  const { userId } = req.body;
  
  try {
    const chats = await prisma.chats.findMany({
      where: {
        userId: userId,
      },
    });
    res.status(200).json({
      status: 'success',
      data: {
        chats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
      error: error,
    });
  }
};
