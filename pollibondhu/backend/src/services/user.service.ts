import { PrismaClient, Prisma } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../patterns/singleton/Logger';

export class UserService {
  private userRepo: UserRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.userRepo = new UserRepository(prisma);
  }

  async getProfile(user_id: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true, email: true, full_name: true, phone: true, nid: true,
        district: true, division: true, upazila: true, avatar_url: true,
        role: true, is_active: true, created_at: true,
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
        user_departments: { select: { department_id: true } },
        user_locations: { select: { location_id: true } },
      },
    });
    if (!user) throw new Error('User not found');

    const roles: string[] = user.user_roles.map((ur: any) => ur.role.name);
    if (roles.length === 0 && user.role) roles.push(user.role);

    const permissionSet = new Set<string>();
    for (const ur of user.user_roles) {
      for (const rp of (ur as any).role.role_permissions) {
        permissionSet.add((rp as any).permission.name);
      }
    }
    // Legacy fallback
    if (permissionSet.size === 0) {
      const LEGACY: Record<string, string[]> = {
        SUPER_ADMIN: ['user.view','user.create','user.update','user.delete','dashboard.super.view','dashboard.admin.view','service.view','service.create','service.update','service.delete','service.approve','complaint.view','complaint.create','complaint.assign','complaint.update','complaint.resolve','application.view','application.process','application.approve','application.reject','budget.view','budget.create','budget.update','budget.approve','project.view','project.create','project.update','department.view','department.create','department.update','department.manage_officers','notification.broadcast','audit.view','audit.export','settings.view','settings.update','message.send','message.receive','message.group_create','agriculture.view','agriculture.create','agriculture.update','education.view','institution.create','institution.manage','ngo.view','ngo.create','ngo.manage','event.view','event.create','news.view','news.create','news.publish','waste.view','waste.manage','emergency.view','emergency.manage'],
        SUB_ADMIN: ['user.view','complaint.view','complaint.assign','complaint.update','complaint.resolve','application.view','application.process','application.approve','application.reject','budget.view','budget.create','budget.update','dashboard.subadmin.view','message.send','message.receive','message.group_create','service.view','service.create','service.update','service.approve','project.view','project.create','project.update','department.view','department.update','department.manage_officers','notification.broadcast','agriculture.view','agriculture.create','agriculture.update','education.view','ngo.view','event.view','event.create','news.view','news.create','news.publish','waste.view','waste.manage','emergency.view','emergency.manage'],
        OFFICER: ['user.view','complaint.view','complaint.update','application.view','application.process','application.approve','application.reject','dashboard.officer.view','message.send','message.receive','message.department_chat','service.view','project.view','project.update','department.view','agriculture.view','agriculture.create','agriculture.update','education.view','event.view','event.create','news.view','waste.view','waste.manage','emergency.view','emergency.manage'],
        SERVICE_PROVIDER: ['service.view','service.create','service.update','service.delete','message.send','message.receive','dashboard.citizen.view'],
        GOV_SERVICE_PROVIDER: ['service.view','service.create','service.update','service.delete','application.view','application.process','application.approve','application.reject','message.send','message.receive','message.group_create','dashboard.citizen.view','notification.broadcast'],
        CITIZEN: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
        USER: ['complaint.create','complaint.view','application.view','message.send','message.receive','dashboard.citizen.view'],
      };
      for (const r of roles) {
        for (const p of (LEGACY[r] || [])) permissionSet.add(p);
      }
    }

    return {
      ...user,
      roles,
      permissions: Array.from(permissionSet),
      department_ids: user.user_departments.map((ud: any) => ud.department_id),
      location_ids: user.user_locations.map((ul: any) => ul.location_id),
    };
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
