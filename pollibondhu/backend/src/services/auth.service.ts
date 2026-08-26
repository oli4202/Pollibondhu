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
    const role = data.role === 'PROVIDER' ? 'SERVICE_PROVIDER' : 'CITIZEN';
    const user = await this.userRepo.create({
      email: data.email,
      password_hash,
      full_name: data.full_name,
      phone: data.phone || undefined,
      role,
    });

    const rbacRole = await this.prisma.role.findUnique({ where: { name: role } });
    if (rbacRole) {
      await this.prisma.userRole.create({ data: { user_id: user.user_id, role_id: rbacRole.role_id } });
    }

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    return {
      user: { user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role, roles: [role] },
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
    
    // Legacy fallback — only used when no database roles/permissions are assigned
    if (permissionSet.size === 0) {
      const LEGACY: Record<string, string[]> = {
        ADMIN: ['user.view','user.create','user.update','user.delete','role.view','role.create','role.update','role.delete','permission.view','permission.assign','dashboard.admin.view','service.view','service.create','service.update','service.delete','service.approve','complaint.view','complaint.create','complaint.assign','complaint.update','complaint.resolve','application.view','application.process','application.approve','application.reject','budget.view','budget.create','budget.update','budget.approve','project.view','project.create','project.update','project.delete','department.view','department.create','department.update','department.manage_officers','notification.broadcast','audit.view','audit.export','settings.view','settings.update','message.send','message.receive','message.group_create','agriculture.view','agriculture.create','agriculture.update','education.view','institution.create','institution.manage','ngo.view','ngo.create','ngo.manage','event.view','event.create','news.view','news.create','news.publish','waste.view','waste.manage','waste.zone.manage','emergency.view','emergency.manage','emergency.contact.manage'],
        OFFICER: ['user.view','complaint.view','complaint.update','complaint.assign','complaint.resolve','application.view','application.process','application.approve','application.reject','dashboard.officer.view','message.send','message.receive','message.department_chat','service.view','project.view','project.update','department.view','agriculture.view','agriculture.create','agriculture.update','education.view','event.view','event.create','news.view','waste.view','waste.manage','emergency.view','emergency.manage'],
        SERVICE_PROVIDER: ['service.view','service.create','service.update','service.delete','message.send','message.receive','dashboard.citizen.view'],
        GOV_SERVICE_PROVIDER: ['service.view','service.create','service.update','service.delete','application.view','application.process','application.approve','application.reject','message.send','message.receive','message.group_create','dashboard.citizen.view','notification.broadcast'],
        CITIZEN: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
        USER: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
        FARMER: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
      };
      for (const r of roles) {
        for (const p of (LEGACY[r] || [])) permissionSet.add(p);
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
    await this.prisma.passwordResetToken.deleteMany({ where: { user_id: user.user_id } });
    await this.prisma.passwordResetToken.create({
      data: { user_id: user.user_id, token_hash: this.hashResetToken(otp), expires_at: expiresAt },
    });

    // In production, send OTP via email/SMS. For dev, return it.
    logger.info(`Password reset token created for user ${user.user_id}`);
    return {
      message: 'If an account with that email exists, a reset code has been sent.',
      // Dev mode: include OTP in response (remove in production)
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    logger.info(`Password reset attempt for: ${email}`);
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('Invalid reset request');

    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        user_id: user.user_id,
        token_hash: this.hashResetToken(otp),
        used_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });
    if (!token) throw new Error('Invalid or expired reset code');

    // Hash the new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { user_id: user.user_id }, data: { password_hash } }),
      this.prisma.passwordResetToken.update({ where: { reset_token_id: token.reset_token_id }, data: { used_at: new Date() } }),
      this.prisma.passwordResetToken.deleteMany({ where: { user_id: user.user_id, reset_token_id: { not: token.reset_token_id } } }),
      this.prisma.refreshToken.deleteMany({ where: { user_id: user.user_id } }),
    ]);

    return { message: 'Password reset successful. You can now log in with your new password.' };
  }

  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
