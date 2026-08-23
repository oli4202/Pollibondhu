import { PrismaClient } from '@prisma/client';

/**
 * Singleton Pattern: DatabaseManager
 * Problem: Creating multiple PrismaClient instances wastes connections
 * and causes race conditions in a Node.js server.
 * Solution: Ensure only one PrismaClient instance exists globally.
 */
export class DatabaseManager {
  private static instance: PrismaClient | null = null;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
      });
    }
    return DatabaseManager.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.$disconnect();
      DatabaseManager.instance = null;
    }
  }
}

export const prisma = DatabaseManager.getInstance();
