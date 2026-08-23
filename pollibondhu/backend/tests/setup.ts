import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

jest.mock('../src/patterns/singleton/DatabaseManager', () => ({
  prisma: prismaMock,
  DatabaseManager: {
    getInstance: () => prismaMock,
  },
}));
