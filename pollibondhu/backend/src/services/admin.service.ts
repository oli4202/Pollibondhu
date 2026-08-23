import { PrismaClient } from '@prisma/client';
import { AdminDashboardFacade } from '../patterns/facade/AdminDashboardFacade';
import { UserRepository } from '../repositories/user.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ComplaintRepository } from '../repositories/complaint.repository';
import { logger } from '../patterns/singleton/Logger';

export class AdminService {
  private dashboardFacade: AdminDashboardFacade;
  private userRepo: UserRepository;
  private serviceRepo: ServiceRepository;
  private complaintRepo: ComplaintRepository;

  constructor(private prisma: PrismaClient) {
    this.dashboardFacade = new AdminDashboardFacade(prisma);
    this.userRepo = new UserRepository(prisma);
    this.serviceRepo = new ServiceRepository(prisma);
    this.complaintRepo = new ComplaintRepository(prisma);
  }

  async getDashboardStats() {
    return this.dashboardFacade.getDashboardStats();
  }

  async getWeeklyStats() {
    return this.dashboardFacade.getWeeklyStats();
  }

  async getGrowthMetrics(days: number) {
    return this.dashboardFacade.getGrowthMetrics(days);
  }

  async listUsers(options: any) {
    return this.userRepo.findAll(options);
  }

  async listServices(options: any) {
    return this.serviceRepo.findAll(options);
  }

  async listComplaints(options: any) {
    return this.complaintRepo.findAll(options);
  }
}
