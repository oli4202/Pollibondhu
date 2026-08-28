import { PrismaClient } from '@prisma/client';
import { ServiceRepository } from '../repositories/service.repository';
import { appEventSubject } from '../patterns/observer/NotificationSubject';
import { logger } from '../patterns/singleton/Logger';

export class ServiceService {
  private repo: ServiceRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new ServiceRepository(prisma);
  }

  async createService(data: any, provider_id: number) {
    logger.info(`Creating service by provider ${provider_id}`);
    const { category, ...serviceData } = data;
    let category_id = serviceData.category_id;
    if (category) {
      const categoryName = category === 'Government' ? 'Citizen' : category;
      const matchedCategory = await this.prisma.category.findFirst({
        where: { name: categoryName, type: 'SERVICE', is_active: true },
      });
      if (!matchedCategory) throw new Error('Selected service category is unavailable');
      category_id = matchedCategory.category_id;
    }
    const service = await this.repo.create({
      ...serviceData,
      ...(category_id ? { category: { connect: { category_id } } } : {}),
      provider: { connect: { user_id: provider_id } },
      status: 'PENDING',
    });
    return service;
  }

  async approveService(service_id: number, admin_id: number) {
    logger.info(`Admin ${admin_id} approving service ${service_id}`);
    const service = await this.repo.update(service_id, { status: 'APPROVED' });

    await appEventSubject.notify({
      type: 'SERVICE_APPROVED',
      payload: { provider_id: service.provider_id, service_id: service.service_id, service_title: service.title, admin_id, entity_type: 'SERVICE', entity_id: service_id },
      timestamp: new Date(),
    }, this.prisma);

    return service;
  }

  async listServices(options: any) {
    return this.repo.findAll(options);
  }

  async getServiceDetails(service_id: number) {
    const service = await this.repo.findById(service_id);
    if (!service) throw new Error('Service not found');
    return service;
  }

  async updateService(service_id: number, data: any, user_id: number, user_role: string) {
    const existing = await this.repo.findById(service_id);
    if (!existing) throw new Error('Service not found');
    if (user_role !== 'ADMIN' && existing.provider_id !== user_id) {
      throw new Error('Unauthorized to update this service');
    }
    const { category, ...rawData } = data;
    const allowedFields = ['title', 'description', 'price', 'location', 'district', 'category_id', 'is_available'];
    const update: Record<string, any> = Object.fromEntries(Object.entries(rawData).filter(([key]) => allowedFields.includes(key)));
    if (category) {
      const matchedCategory = await this.prisma.category.findFirst({
        where: { name: category, type: 'SERVICE', is_active: true },
      });
      if (!matchedCategory) throw new Error('Selected service category is unavailable');
      update.category = { connect: { category_id: matchedCategory.category_id } };
    }
    if (Object.keys(update).length === 0) throw new Error('No valid service fields supplied');

    // Changes to what is being offered need a fresh review. Toggling visibility does not.
    const requiresReview = user_role !== 'ADMIN' && ['title', 'description', 'price', 'location', 'district', 'category_id', 'category']
      .some((field) => field in update);
    if (requiresReview) update.status = 'PENDING';

    return this.repo.update(service_id, update);
  }

  async deleteService(service_id: number, user_id: number, user_role: string) {
    const existing = await this.repo.findById(service_id);
    if (!existing) throw new Error('Service not found');
    if (user_role !== 'ADMIN' && existing.provider_id !== user_id) {
      throw new Error('Unauthorized to delete this service');
    }
    return this.repo.delete(service_id);
  }
}
