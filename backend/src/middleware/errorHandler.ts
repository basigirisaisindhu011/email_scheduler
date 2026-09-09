import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  return res.status(500).json({
    message: 'Internal server error',
    details: error.message,
  });
};
