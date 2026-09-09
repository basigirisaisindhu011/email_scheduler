import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};
