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

  async getDashboardStats(): Promise<any> {
    logger.info('AdminDashboardFacade: Aggregating SUPER_ADMIN dashboard statistics');

    const [
      totalUsers,
      activeProviders,
      pendingEscalations,
      activeProjects,
      escalatedComplaints,
      departmentsData,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CITIZEN' } }),
      this.prisma.user.count({ where: { role: { in: ['SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER'] }, is_active: true } }),
      this.prisma.providerComplaint.count({ where: { status: 'ESCALATED' } }),
      this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.providerComplaint.findMany({
        where: { status: 'ESCALATED' },
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true } },
          provider: { select: { full_name: true } },
        },
      }),
      this.prisma.department.findMany({
        select: {
          department_id: true,
          name: true,
          _count: {
            select: {
              applications: true,
              projects: true,
              complaints: true
            }
          },
          projects: {
            select: { budget: true, spent: true, status: true }
          }
        }
      })
    ]);

    const departmentStats = departmentsData.map(dept => {
      const allocated = dept.projects.reduce((sum, p) => sum + Number(p.budget), 0);
      const spent = dept.projects.reduce((sum, p) => sum + Number(p.spent), 0);
      return {
        department_id: dept.department_id,
        name: dept.name,
        _count: dept._count,
        budget: allocated,
        spent: spent,
        remaining: allocated - spent
      };
    });
    
    const totals = {
      totalAllocated: departmentStats.reduce((s, b) => s + b.budget, 0),
      totalSpent: departmentStats.reduce((s, b) => s + b.spent, 0),
      totalRemaining: departmentStats.reduce((s, b) => s + b.remaining, 0),
    };

    // Get Provider Performance
    const providers = await this.prisma.user.findMany({
      where: { role: { in: ['SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER'] } },
      take: 5,
      select: {
        user_id: true,
        full_name: true,
        role: true,
        is_active: true,
        _count: {
          select: {
            provider_complaints_rcvd: { where: { status: 'RESOLVED' } },
          }
        },
        services: {
          select: {
            _count: {
              select: {
                applications: { where: { status: 'APPROVED' } }
              }
            }
          }
        }
      }
    });

    const providerPerformance = providers.map(p => {
      const completedApps = p.services.reduce((acc, service) => acc + service._count.applications, 0);
      return {
        id: p.user_id,
        name: p.full_name,
        role: p.role,
        status: p.is_active ? 'Active' : 'Suspended',
        completedApplications: completedApps,
        resolvedComplaints: p._count.provider_complaints_rcvd,
        rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1), // Mock rating
      };
    });

    return {
      totalUsers,
      activeProviders,
      pendingEscalations,
      activeProjects,
      escalatedComplaints,
      providerPerformance,
      departmentStats,
      budgetOverview: totals,
    };
  }

  async getSubAdminDashboardStats(adminId: number): Promise<any> {
    logger.info(`AdminDashboardFacade: Aggregating SUB_ADMIN stats for admin ${adminId}`);
    
    // Find department(s) assigned to this Sub-Admin
    const userDepartments = await this.prisma.userDepartment.findMany({
      where: { user_id: adminId },
      select: { department_id: true, department: { select: { name: true } } }
    });
    
    const departmentIds = userDepartments.map(ud => ud.department_id);
    const departmentNames = userDepartments.map(ud => ud.department.name).join(', ');

    if (departmentIds.length === 0) {
      return { error: 'No departments assigned to this Sub-Admin' };
    }

    const [
      officerCount,
      complaints,
      applications,
      projects
    ] = await Promise.all([
      this.prisma.userDepartment.count({
        where: { 
          department_id: { in: departmentIds },
          user: { role: 'OFFICER' }
        }
      }),
      this.prisma.complaint.groupBy({
        by: ['status'],
        where: { department_id: { in: departmentIds } },
        _count: true
      }),
      this.prisma.application.groupBy({
        by: ['status'],
        where: { department_id: { in: departmentIds } },
        _count: true
      }),
      this.prisma.project.findMany({
        where: { department_id: { in: departmentIds } },
        orderBy: { updated_at: 'desc' },
        take: 5
      })
    ]);

    const totalComplaints = complaints.reduce((sum, c) => sum + c._count, 0);
    const resolvedComplaints = complaints.find(c => c.status === 'RESOLVED')?._count || 0;
    
    const totalApplications = applications.reduce((sum, a) => sum + a._count, 0);
    const approvedApplications = applications.find(a => a.status === 'APPROVED')?._count || 0;

    return {
      departments: departmentNames,
      departmentIds,
      officers: officerCount,
      complaints: { total: totalComplaints, resolved: resolvedComplaints },
      applications: { total: totalApplications, approved: approvedApplications },
      recentProjects: projects,
    };
  }

  async getOfficerDashboardStats(officerId: number): Promise<any> {
    logger.info(`AdminDashboardFacade: Aggregating OFFICER stats for user ${officerId}`);
    
    const [
      assignedProjects,
      assignedComplaints,
      messages,
      myApplications
    ] = await Promise.all([
      this.prisma.project.count({ where: { assigned_to: officerId } }),
      this.prisma.complaint.count({ where: { assigned_to: officerId, status: { not: 'CLOSED' } } }),
      this.prisma.message.count({ where: { receiver_id: officerId, is_read: false } }),
      this.prisma.application.count({ where: { reviewed_by: officerId, status: { in: ['SUBMITTED', 'RESUBMITTED'] } } })
    ]);

    return {
      tasks: assignedProjects,
      applications: myApplications,
      complaints: assignedComplaints,
      messages: messages
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

