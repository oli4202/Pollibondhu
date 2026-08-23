import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { logger } from '../patterns/singleton/Logger';

export class AuthService {
  private userRepo: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepo = new UserRepository(prisma);
  }

  async register(data: { email: string; password: string; full_name: string; phone?: string; role?: string }) {
    logger.info(`Registering user: ${data.email}`);
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const password_hash = await hashPassword(data.password);
    const user = await this.userRepo.create({
      email: data.email,
      password_hash,
      full_name: data.full_name,
      phone: data.phone,
      role: (data.role as any) || 'USER',
    });

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    return {
      user: { user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async login(email: string, password: string) {
    logger.info(`Login attempt: ${email}`);
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');
    if (!user.is_active) throw new Error('Account deactivated');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    return {
      user: { user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}
