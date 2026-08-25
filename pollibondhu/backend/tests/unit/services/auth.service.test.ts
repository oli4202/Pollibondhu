import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { mockUser } from '../../mocks/data.mock';
import { prismaMock } from '../../setup';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(prismaMock as any);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const result = await authService.register({
        email: 'new@user.com',
        password: 'password123',
        full_name: 'New User',
      });

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('mocktoken');
      expect(prismaMock.user.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        authService.register({ email: 'rahim@pollibondhu.test', password: 'pass', full_name: 'Rahim' })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const result = await authService.login('rahim@pollibondhu.test', 'password123');

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('mocktoken');
    });

    it('should throw error for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('wrong@email.com', 'pass')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for deactivated account', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, is_active: false } as any);

      await expect(authService.login('rahim@pollibondhu.test', 'pass')).rejects.toThrow('Account deactivated');
    });

    it('should throw error for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('rahim@pollibondhu.test', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });
  });
});
