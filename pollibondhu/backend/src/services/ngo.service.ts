import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateOrganisationData {
  name: string;
  name_bn?: string;
  type: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
}

export interface CreateProgrammeData {
  organisation_id: number;
  name: string;
  description?: string;
  type: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  beneficiaries?: number;
}

export interface CreateDonationData {
  organisation_id: number;
  amount: number;
  currency?: string;
  donor_name?: string;
  purpose?: string;
}

export class NgoService {
  // Organisations
  async listOrganisations(filters?: { type?: string; search?: string; district?: string }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.district) where.district = filters.district;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }
    return prisma.organisation.findMany({
      where,
      include: {
        programmes: true,
        _count: { select: { programmes: true, donations: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getOrganisation(id: number) {
    return prisma.organisation.findUnique({
      where: { organisation_id: id },
      include: {
        programmes: { orderBy: { created_at: 'desc' } },
        donations: { orderBy: { created_at: 'desc' }, take: 20 },
        members: { include: { user: { select: { full_name: true, role: true } } } },
        _count: { select: { programmes: true, donations: true } },
      },
    });
  }

  async createOrganisation(data: CreateOrganisationData) {
    return prisma.organisation.create({ data });
  }

  async updateOrganisation(id: number, data: Partial<CreateOrganisationData>) {
    return prisma.organisation.update({ where: { organisation_id: id }, data });
  }

  async deleteOrganisation(id: number) {
    return prisma.organisation.delete({ where: { organisation_id: id } });
  }

  // Programmes
  async listProgrammes(organisationId?: number) {
    const where: any = {};
    if (organisationId) where.organisation_id = organisationId;
    return prisma.ngoProgramme.findMany({
      where,
      include: { organisation: { select: { name: true, type: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getProgramme(id: number) {
    return prisma.ngoProgramme.findUnique({
      where: { programme_id: id },
      include: { organisation: true },
    });
  }

  async createProgramme(data: CreateProgrammeData) {
    return prisma.ngoProgramme.create({
      data: {
        organisation_id: data.organisation_id,
        name: data.name,
        description: data.description,
        type: data.type,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
        budget: data.budget,
        beneficiaries: data.beneficiaries,
      },
    });
  }

  async updateProgramme(id: number, data: Partial<CreateProgrammeData>) {
    return prisma.ngoProgramme.update({ where: { programme_id: id }, data });
  }

  async deleteProgramme(id: number) {
    return prisma.ngoProgramme.delete({ where: { programme_id: id } });
  }

  // Donations
  async listDonations(filters?: { organisation_id?: number; programme_id?: number }) {
    const where: any = {};
    if (filters?.organisation_id) where.organisation_id = filters.organisation_id;
    return prisma.donation.findMany({
      where,
      include: { organisation: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async createDonation(data: CreateDonationData) {
    return prisma.donation.create({
      data: {
        organisation_id: data.organisation_id,
        amount: data.amount,
        currency: data.currency || 'BDT',
        donor_name: data.donor_name,
        purpose: data.purpose,
      },
    });
  }

  // Stats
  async getOrganisationStats(id: number) {
    const org = await prisma.organisation.findUnique({ where: { organisation_id: id } });
    if (!org) return null;

    const programmeCount = await prisma.ngoProgramme.count({ where: { organisation_id: id } });
    const donationCount = await prisma.donation.count({ where: { organisation_id: id } });
    const activeProgrammes = await prisma.ngoProgramme.count({ where: { organisation_id: id, status: 'ACTIVE' } });

    const totalDonations = await prisma.donation.aggregate({
      where: { organisation_id: id },
      _sum: { amount: true },
    });

    return {
      programme_count: programmeCount,
      donation_count: donationCount,
      active_programmes: activeProgrammes,
      total_donations: Number(totalDonations._sum.amount || 0),
    };
  }
}

export const ngoService = new NgoService();
