import { PrismaClient, User, Prisma } from '@prisma/client';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(user_id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { user_id } });
  }

  async findAll(options: { page: number; limit: number; role?: string; search?: string }) {
    const { page, limit, role, search } = options;
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as any;
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true, email: true, full_name: true, phone: true,
          district: true, role: true, is_active: true, created_at: true,
          avatar_url: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(user_id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { user_id }, data });
  }

  async delete(user_id: number): Promise<User> {
    return this.prisma.user.delete({ where: { user_id } });
  }

  async countByRole(role: string): Promise<number> {
    return this.prisma.user.count({ where: { role: role as any } });
  }
}
