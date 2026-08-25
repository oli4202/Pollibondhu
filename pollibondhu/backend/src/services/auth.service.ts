import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { logger } from '../patterns/singleton/Logger';
import crypto from 'crypto';

export class AuthService {
  private userRepo: UserRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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

    // Fetch full RBAC context for the user
    const fullUser = await this.prisma.user.findUnique({
      where: { user_id: user.user_id },
      select: {
        user_id: true, email: true, full_name: true, role: true,
        phone: true, district: true, division: true, upazila: true, avatar_url: true,
        user_roles: {
          select: {
            role: {
              select: {
                name: true,
                role_permissions: {
                  select: { permission: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    const roles: string[] = (fullUser?.user_roles || []).map((ur: any) => ur.role.name);
    if (roles.length === 0 && user.role) roles.push(user.role);

    const permissionSet = new Set<string>();
    for (const ur of (fullUser?.user_roles || [])) {
      for (const rp of (ur as any).role.role_permissions) {
        permissionSet.add((rp as any).permission.name);
      }
    }
    const permissions = Array.from(permissionSet);

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    return {
      user: {
        user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role,
        phone: fullUser?.phone, district: fullUser?.district, division: fullUser?.division,
        upazila: fullUser?.upazila, avatar_url: fullUser?.avatar_url,
        roles, permissions,
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async forgotPassword(email: string) {
    logger.info(`Password reset requested for: ${email}`);
    const user = await this.userRepo.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP temporarily — in production use a separate token table
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { password_hash: otp } as any,
    }).catch(() => {});

    // In production, send OTP via email/SMS. For dev, return it.
    logger.info(`Password reset OTP for ${email}: ${otp}`);
    return {
      message: 'If an account with that email exists, a reset code has been sent.',
      // Dev mode: include OTP in response (remove in production)
      ...(process.env.NODE_ENV === 'development' ? { otp, expiresAt } : {}),
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    logger.info(`Password reset attempt for: ${email}`);
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('Invalid reset request');

    // Hash the new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { password_hash },
    });

    return { message: 'Password reset successful. You can now log in with your new password.' };
  }
}
