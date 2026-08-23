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
    const service = await this.repo.create({
      ...data,
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
    return this.repo.update(service_id, data);
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
