import { Request, Response } from 'express';

export const getCurrentGroup = (req:Request, res:Response) => {
    res.status(200).json({
      'status': 'success',
      current_user: {
        'id': '1234',
        'email': 'xxx'
      }
    })
  }