import dotenv from 'dotenv';
import { logger } from '../patterns/singleton/Logger';

dotenv.config();

/**
 * Singleton Pattern: ConfigManager
 * Problem: Environment variables scattered across codebase cause
 * maintenance issues and security risks.
 * Solution: Centralized, validated configuration loaded once.
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  public readonly databaseUrl: string;
  public readonly jwtSecret: string;
  public readonly jwtRefreshSecret: string;
  public readonly port: number;
  public readonly nodeEnv: string;

  private constructor() {
    this.databaseUrl = this.getEnvVar('DATABASE_URL');
    this.jwtSecret = this.getEnvVar('JWT_SECRET');
    this.jwtRefreshSecret = this.getEnvVar('JWT_REFRESH_SECRET');
    this.port = parseInt(this.getEnvVar('PORT', '4000'), 10);
    this.nodeEnv = this.getEnvVar('NODE_ENV', 'development');
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
      logger.error(`Missing required environment variable: ${key}`);
      throw new Error(`Environment variable ${key} is required`);
    }
    return value;
  }
}

export const config = ConfigManager.getInstance();
