import { Request, Response } from 'express';
import prisma from '../db';


export const getCurrentUser = (req:Request, res:Response) => {
  res.status(200).json({
    'status': 'success',
    current_user: {
      'id': '1234',
      'email': 'xxx'
    }
  })
}

export async function createController (req:Request, res:Response) {
  const { email, username, password } = req.body
  
  const findUniqueEmail = await prisma.users.findUnique({
    where: {
      email: email
    }  
  })
  const findUniqueUsername = await prisma.users.findUnique({
    where: {
      username: username
    }  
  })
  if (findUniqueEmail !== null || findUniqueUsername !== null) {
    return res.status(400).json({
      status: 'error',
      message: 'User already exists'
    })
  } else {
    try {
      const user = await prisma.users.create({
        data: {
          email: email,
          username: username,
          password: password
        }
      })
      res.status(200).json({
        status: 'User Created',
        user
      })
    }
    catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      })
    }
  }
}

