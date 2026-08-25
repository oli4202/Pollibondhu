import request from 'supertest';
import app from '../../src/app';
import { prismaMock } from '../setup';
import { mockUser } from '../mocks/data.mock';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Integration Tests', () => {
  describe('Auth Routes', () => {
    it('POST /api/auth/register - should register user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (jwt.sign as jest.Mock).mockReturnValue('token');

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'password123', full_name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/register - should reject invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: '123', full_name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login - should authenticate user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rahim@pollibondhu.test', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/login - should reject wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rahim@pollibondhu.test', password: 'wrong' });

      expect(res.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    it('GET /api/users/profile - should reject without token', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/dashboard - should reject non-admin', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ user_id: 1, email: 'user@test.com', role: 'USER' });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer faketoken');

      expect(res.status).toBe(401);
    });
  });

  describe('Service Routes', () => {
    it('GET /api/services - should list services publicly', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);

      const res = await request(app).get('/api/services');
      expect(res.status).toBe(200);
    });
  });

  describe('Health Check', () => {
    it('GET /health - should return status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
