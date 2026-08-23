import { Request, Response, NextFunction } from 'express';
import { logger } from '../patterns/singleton/Logger';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Error: ${err.message} | Route: ${req.method} ${req.path}`);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ success: false, error: message });
}
