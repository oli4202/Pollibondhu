import { PrismaClient, Prisma } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../patterns/singleton/Logger';

export class UserService {
  private userRepo: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepo = new UserRepository(prisma);
  }

  async getProfile(user_id: number) {
    const user = await this.userRepo.findById(user_id);
    if (!user) throw new Error('User not found');
    const { password_hash, ...profile } = user as any;
    return profile;
  }

  async updateProfile(user_id: number, data: Prisma.UserUpdateInput) {
    logger.info(`Updating profile for user ${user_id}`);
    // Prevent role escalation via profile update
    if (data.role) delete data.role;
    if (data.password_hash) delete data.password_hash;
    return this.userRepo.update(user_id, data);
  }

  async listUsers(options: { page: number; limit: number; role?: string; search?: string }) {
    return this.userRepo.findAll(options);
  }

  async toggleUserStatus(user_id: number, is_active: boolean) {
    logger.info(`Toggling user ${user_id} status to ${is_active}`);
    return this.userRepo.update(user_id, { is_active });
  }

  async changeRole(user_id: number, role: string) {
    logger.info(`Changing user ${user_id} role to ${role}`);
    return this.userRepo.update(user_id, { role: role as any });
  }
}
