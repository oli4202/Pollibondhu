import { PrismaClient, Prisma } from '@prisma/client';

export class ComplaintRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(complaint_id: number) {
    return this.prisma.complaint.findUnique({
      where: { complaint_id },
      include: { user: { select: { full_name: true, email: true } }, reviewer: { select: { full_name: true } } },
    });
  }

  async findAll(options: { page: number; limit: number; status?: string; user_id?: number }) {
    const { page, limit, status, user_id } = options;
    const where: Prisma.ComplaintWhereInput = {};
    if (status) where.status = status as any;
    if (user_id) where.user_id = user_id;

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submitted_at: 'desc' },
        include: { user: { select: { full_name: true, district: true } }, reviewer: { select: { full_name: true } } },
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: Prisma.ComplaintCreateInput) {
    return this.prisma.complaint.create({ data });
  }

  async update(complaint_id: number, data: Prisma.ComplaintUpdateInput) {
    return this.prisma.complaint.update({ where: { complaint_id }, data });
  }
}
