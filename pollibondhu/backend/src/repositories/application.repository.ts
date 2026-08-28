import { PrismaClient, Prisma } from '@prisma/client';

export class ApplicationRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(application_id: number) {
    return this.prisma.application.findUnique({
      where: { application_id },
      include: {
        user: { select: { user_id: true, full_name: true, email: true, phone: true, district: true } },
        service: { select: { service_id: true, title: true, description: true, price: true } },
        department: { select: { department_id: true, name: true } },
        documents: { orderBy: { created_at: 'desc' } },
        updates: { orderBy: { created_at: 'desc' }, include: { user: { select: { full_name: true } } } },
      },
    });
  }

  async findByTrackingId(tracking_id: string) {
    return this.prisma.application.findUnique({
      where: { tracking_id },
      include: {
        user: { select: { user_id: true, full_name: true, email: true } },
        service: { select: { title: true } },
        documents: true,
        updates: { orderBy: { created_at: 'desc' }, include: { user: { select: { full_name: true } } } },
      },
    });
  }

  async findAll(options: { page: number; limit: number; status?: string; user_id?: number; service_id?: number; department_id?: number; provider_id?: number }) {
    const { page, limit, status, user_id, service_id, department_id, provider_id } = options;
    const where: Prisma.ApplicationWhereInput = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (service_id) where.service_id = service_id;
    if (department_id) where.department_id = department_id;
    if (provider_id) where.service = { provider_id };

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submitted_at: 'desc' },
        include: {
          user: { select: { full_name: true, email: true, district: true } },
          service: { select: { title: true } },
          department: { select: { name: true } },
          documents: true,
          updates: { orderBy: { created_at: 'desc' }, include: { user: { select: { full_name: true } } } },
        },
      }),
      this.prisma.application.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: Prisma.ApplicationCreateInput) {
    return this.prisma.application.create({ data });
  }

  async update(application_id: number, data: Prisma.ApplicationUpdateInput) {
    return this.prisma.application.update({ where: { application_id }, data });
  }

  async addUpdate(application_id: number, data: { user_id?: number; old_status?: string; new_status?: string; notes?: string; is_internal?: boolean }) {
    return this.prisma.applicationUpdate.create({
      data: { application_id, ...data },
    });
  }

  async addDocument(data: Prisma.ApplicationDocumentCreateInput) {
    return this.prisma.applicationDocument.create({ data });
  }

  async countByStatus(status: string) {
    return this.prisma.application.count({ where: { status } });
  }

  async generateTrackingId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.application.count();
    return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
