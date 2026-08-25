import { PrismaClient, Prisma } from '@prisma/client';

export class NgoRepository {
  constructor(private prisma: PrismaClient) {}

  async findOrganisation(organisation_id: number) {
    return this.prisma.organisation.findUnique({
      where: { organisation_id },
      include: {
        members: { include: { user: { select: { full_name: true, email: true } } } },
        programmes: { orderBy: { created_at: 'desc' } },
        _count: { select: { donations: true, programmes: true } },
      },
    });
  }

  async listOrganisations(options: { page: number; limit: number; type?: string; district?: string; search?: string }) {
    const { page, limit, type, district, search } = options;
    const where: Prisma.OrganisationWhereInput = {};
    if (type) where.type = type;
    if (district) where.district = district;
    if (search) where.OR = [{ name: { contains: search } }, { name_bn: { contains: search } }];

    const [data, total] = await Promise.all([
      this.prisma.organisation.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { programmes: true, donations: true } } },
      }),
      this.prisma.organisation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createOrganisation(data: Prisma.OrganisationCreateInput) {
    return this.prisma.organisation.create({ data });
  }

  async updateOrganisation(organisation_id: number, data: Prisma.OrganisationUpdateInput) {
    return this.prisma.organisation.update({ where: { organisation_id }, data });
  }

  // Programmes
  async listProgrammes(organisation_id: number) {
    return this.prisma.ngoProgramme.findMany({
      where: { organisation_id },
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { enrolments: true } } },
    });
  }

  async createProgramme(data: Prisma.NgoProgrammeCreateInput) {
    return this.prisma.ngoProgramme.create({ data });
  }

  async enrolInProgramme(programme_id: number, user_id: number) {
    return this.prisma.programmeEnrolment.create({
      data: {
        programme: { connect: { programme_id } },
        user: { connect: { user_id } },
      },
    });
  }

  // Donations
  async createDonation(data: Prisma.DonationCreateInput) {
    return this.prisma.donation.create({ data });
  }

  async listDonations(organisation_id: number, page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where: { organisation_id },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.donation.count({ where: { organisation_id } }),
    ]);
    return { data, total, page, limit };
  }
}
