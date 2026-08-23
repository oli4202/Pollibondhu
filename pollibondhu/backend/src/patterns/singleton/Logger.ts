import winston from 'winston';

/**
 * Singleton Pattern: Logger
 * Problem: Multiple logger instances cause duplicate logs and 
 * inconsistent formatting across the application.
 * Solution: Single Winston instance used by all modules.
 */
export class Logger {
  private static instance: winston.Logger | null = null;

  private constructor() {}

  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'pollibondhu-api' },
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      });
    }
    return Logger.instance;
  }
}

export const logger = Logger.getInstance();
