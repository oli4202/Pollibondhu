import { PrismaClient, Prisma } from '@prisma/client';

export class ServiceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(service_id: number) {
    return this.prisma.service.findUnique({
      where: { service_id },
      include: { provider: { select: { full_name: true, phone: true, district: true } }, category: true },
    });
  }

  async findAll(options: { page: number; limit: number; status?: string; provider_id?: number; search?: string; availableOnly?: boolean }) {
    const { page, limit, status, provider_id, search, availableOnly } = options;
    const where: Prisma.ServiceWhereInput = {};
    if (status) where.status = status as any;
    if (provider_id) where.provider_id = provider_id;
    if (availableOnly) where.is_available = true;
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { provider: { select: { full_name: true, district: true } }, category: true },
      }),
      this.prisma.service.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: Prisma.ServiceCreateInput) {
    return this.prisma.service.create({ data });
  }

  async update(service_id: number, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({ where: { service_id }, data });
  }

  async delete(service_id: number) {
    return this.prisma.service.delete({ where: { service_id } });
  }

  async countByStatus(status: string) {
    return this.prisma.service.count({ where: { status: status as any } });
  }
}
