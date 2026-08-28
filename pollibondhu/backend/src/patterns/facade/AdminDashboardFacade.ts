import { PrismaClient } from '@prisma/client';
import { DashboardStats } from '../../types';
import { logger } from '../singleton/Logger';

/**
 * Facade Pattern: AdminDashboardFacade
 * Problem: Admin dashboard needs aggregated data from 6+ tables
 * (users, services, complaints, posts, activities, bookings).
 * Calling each service individually creates messy, tightly-coupled controllers.
 * Solution: Single facade class orchestrates multiple repositories/services
 * and returns a unified DTO.
 */
export class AdminDashboardFacade {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    logger.info('AdminDashboardFacade: Aggregating dashboard statistics');

    const [
      totalUsers,
      activeUsers,
      totalProviders,
      totalServices,
      pendingServices,
      totalPosts,
      pendingComplaints,
      recentActivities,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { is_active: true } }),
      this.prisma.user.count({ where: { role: 'PROVIDER' } }),
      this.prisma.service.count(),
      this.prisma.service.count({ where: { status: 'PENDING' } }),
      this.prisma.forumPost.count(),
      this.prisma.complaint.count({ where: { status: { in: ['PENDING', 'REVIEWING'] } } }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { admin: { select: { full_name: true } } },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalProviders,
      totalServices,
      pendingServices,
      totalPosts,
      pendingComplaints,
      recentActivities,
    };
  }

  async getGrowthMetrics(days: number = 30): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [userGrowth, serviceGrowth] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['created_at'],
        where: { created_at: { gte: since } },
        _count: { user_id: true },
      }),
      this.prisma.service.groupBy({
        by: ['created_at'],
        where: { created_at: { gte: since } },
        _count: { service_id: true },
      }),
    ]);

    return [
      { label: 'User Growth', data: userGrowth },
      { label: 'Service Growth', data: serviceGrowth },
    ];
  }

  async getWeeklyStats(): Promise<any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [newUsers, newServices, resolvedComplaints, newPosts] = await Promise.all([
      this.prisma.user.count({ where: { created_at: { gte: weekAgo } } }),
      this.prisma.service.count({ where: { created_at: { gte: weekAgo } } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED', resolved_at: { gte: weekAgo } } }),
      this.prisma.forumPost.count({ where: { created_at: { gte: weekAgo } } }),
    ]);

    return { newUsers, newServices, resolvedComplaints, newPosts };
  }
}
