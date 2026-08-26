/**
 * Unit tests — SINGLETON PATTERN
 * Verifies DatabaseManager, Logger and ConfigManager each expose exactly one
 * shared instance. Runs against the REAL modules (unmocked) to prove the
 * singleton contract itself; no database connection is ever opened because
 * PrismaClient only connects lazily on first query.
 */
jest.unmock('../../../src/patterns/singleton/Logger');

import { DatabaseManager } from '../../../src/patterns/singleton/DatabaseManager';
import { Logger } from '../../../src/patterns/singleton/Logger';
import { ConfigManager } from '../../../src/config/env';

describe('Singleton Pattern', () => {
  describe('DatabaseManager', () => {
    it('returns the same PrismaClient instance on every call', () => {
      const first = DatabaseManager.getInstance();
      const second = DatabaseManager.getInstance();
      expect(first).toBe(second);
    });

    it('creates a fresh instance after disconnect()', async () => {
      const original = DatabaseManager.getInstance();
      const disconnectSpy = jest.spyOn(original, '$disconnect').mockResolvedValue();
      await DatabaseManager.disconnect();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(DatabaseManager.getInstance()).not.toBe(original);
    });
  });

  describe('Logger', () => {
    it('returns the same winston logger instance on every call', () => {
      const first = Logger.getInstance();
      const second = Logger.getInstance();
      expect(first).toBe(second);
    });

    it('exposes standard logging levels', () => {
      const logger = Logger.getInstance();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('ConfigManager', () => {
    it('returns the same config instance on every call', () => {
      const first = ConfigManager.getInstance();
      const second = ConfigManager.getInstance();
      expect(first).toBe(second);
    });

    it('loads validated configuration values once', () => {
      const config = ConfigManager.getInstance();
      expect(config.jwtSecret).toBeDefined();
      expect(config.jwtRefreshSecret).toBeDefined();
      expect(config.port).toBe(parseInt(String(process.env.PORT), 10));
    });
  });
});
