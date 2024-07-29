import { Request, Response } from "express";
import prisma from "../db";
import jwt from "jsonwebtoken";

export async function loginController(req: Request, res: Response) {
  const { id } = req.body;
  const user = await prisma.users.findUnique({
    where: {
      userId: id,
    },
  });
  const token = jwt.sign({ id: user?.userId }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
  if (user !== null) {
    return res.status(200).json({
      status: "success",
      user,
      token,
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "Invalid email or password",
    });
  }
}
