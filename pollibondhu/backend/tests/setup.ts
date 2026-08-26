import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Test environment — must be configured BEFORE any src module is imported,
// because config/env.ts validates required variables at import time.
// ---------------------------------------------------------------------------
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.PORT = process.env.PORT || '4000';
process.env.LOG_LEVEL = 'error';

/**
 * Shared deep mock of the entire PrismaClient API.
 * Every unit test injects this instead of touching the real SQLite database.
 */
export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

// The app resolves its single Prisma connection through the Singleton
// DatabaseManager. Tests swap that singleton for prismaMock, so services
// built on `new AuthService(prisma)` transparently receive the mock.
jest.mock('../src/patterns/singleton/DatabaseManager', () => ({
  prisma: prismaMock,
  DatabaseManager: {
    getInstance: () => prismaMock,
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Silence Winston in unit tests (no file transports writing to logs/).
// Individual tests can opt back into the real Logger via jest.unmock +
// jest.requireActual (see tests/unit/patterns/singleton.test.ts).
const loggerStub = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
};
jest.mock('../src/patterns/singleton/Logger', () => ({
  Logger: { getInstance: () => loggerStub },
  logger: loggerStub,
}));
