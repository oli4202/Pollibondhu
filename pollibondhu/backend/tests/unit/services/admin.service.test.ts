/**
 * Unit tests — AdminService
 * All collaborators (AdminDashboardFacade + repositories) are mocked.
 */
import { prismaMock } from '../../setup';
import { AdminService } from '../../../src/services/admin.service';

// Spy on AdminDashboardFacade methods via prismaMock — AdminService builds the facade
// from its prisma instance, which is the mock, so all Prisma calls go through prismaMock.

describe('AdminService', () => {
  let service: AdminService;

  const superAdminStats = {
    totalUsers: 100,
    activeProviders: 20,
    pendingEscalations: 3,
    activeProjects: 8,
    escalatedComplaints: [],
    providerPerformance: [],
    departmentStats: [],
    budgetOverview: { totalAllocated: 0, totalSpent: 0, totalRemaining: 0 },
  };

  beforeEach(() => {
    service = new AdminService(prismaMock);
  });

  // ─── getDashboardStats ───────────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('returns aggregated dashboard stats from facade', async () => {
      // Mock all the Prisma calls that AdminDashboardFacade.getDashboardStats makes
      prismaMock.user.count.mockResolvedValue(100);
      prismaMock.providerComplaint.count.mockResolvedValue(3);
      prismaMock.project.count.mockResolvedValue(8);
      prismaMock.providerComplaint.findMany.mockResolvedValue([]);
      prismaMock.department.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await service.getDashboardStats();
      expect(result).toHaveProperty('totalUsers');
    });
  });

  // ─── getSubAdminDashboardStats ───────────────────────────────────────────────

  describe('getSubAdminDashboardStats', () => {
    it('returns error when no departments assigned', async () => {
      prismaMock.userDepartment.findMany.mockResolvedValue([]);
      const result = await service.getSubAdminDashboardStats(7);
      expect(result).toHaveProperty('error');
    });

    it('returns sub-admin stats when departments exist', async () => {
      prismaMock.userDepartment.findMany.mockResolvedValue([
        { department_id: 1, department: { name: 'Health' } },
      ] as any);
      prismaMock.userDepartment.count.mockResolvedValue(3);
      (prismaMock.complaint.groupBy as unknown as jest.Mock).mockResolvedValue([
        { status: 'PENDING', _count: 5 },
        { status: 'RESOLVED', _count: 3 },
      ]);
      (prismaMock.application.groupBy as unknown as jest.Mock).mockResolvedValue([
        { status: 'SUBMITTED', _count: 4 },
        { status: 'APPROVED', _count: 2 },
      ]);
      prismaMock.project.findMany.mockResolvedValue([]);

      const result = await service.getSubAdminDashboardStats(7);
      expect(result).toHaveProperty('departments', 'Health');
      expect(result).toHaveProperty('officers', 3);
      expect(result.complaints.total).toBe(8);
      expect(result.complaints.resolved).toBe(3);
      expect(result.applications.total).toBe(6);
      expect(result.applications.approved).toBe(2);
    });
  });

  // ─── getOfficerDashboardStats ────────────────────────────────────────────────

  describe('getOfficerDashboardStats', () => {
    it('returns officer-level stats', async () => {
      prismaMock.project.count.mockResolvedValue(4);
      prismaMock.complaint.count.mockResolvedValue(2);
      prismaMock.message.count.mockResolvedValue(1);
      prismaMock.application.count.mockResolvedValue(3);

      const result = await service.getOfficerDashboardStats(10);
      expect(result).toEqual({ tasks: 4, applications: 3, complaints: 2, messages: 1 });
    });
  });

  // ─── getWeeklyStats ──────────────────────────────────────────────────────────

  describe('getWeeklyStats', () => {
    it('returns weekly registration and activity counts', async () => {
      prismaMock.user.count.mockResolvedValue(5);
      prismaMock.service.count.mockResolvedValue(3);
      prismaMock.complaint.count.mockResolvedValue(7);
      prismaMock.forumPost.count.mockResolvedValue(2);

      const result = await service.getWeeklyStats();
      expect(result).toHaveProperty('newUsers', 5);
      expect(result).toHaveProperty('newServices', 3);
      expect(result).toHaveProperty('resolvedComplaints', 7);
      expect(result).toHaveProperty('newPosts', 2);
    });
  });

  // ─── getGrowthMetrics ────────────────────────────────────────────────────────

  describe('getGrowthMetrics', () => {
    it('returns growth metrics for users and services', async () => {
      (prismaMock.user.groupBy as unknown as jest.Mock).mockResolvedValue([]);
      (prismaMock.service.groupBy as unknown as jest.Mock).mockResolvedValue([]);

      const result = await service.getGrowthMetrics(30);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('label', 'User Growth');
      expect(result[1]).toHaveProperty('label', 'Service Growth');
    });
  });

  // ─── listUsers ────────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    it('delegates to user repository findAll', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      const result = await service.listUsers({ page: 1, limit: 10 });
      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(result.total).toBe(0);
    });
  });

  // ─── listServices ─────────────────────────────────────────────────────────────

  describe('listServices', () => {
    it('delegates to service repository findAll', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);

      const result = await service.listServices({ page: 1, limit: 10 });
      expect(prismaMock.service.findMany).toHaveBeenCalled();
    });
  });

  // ─── listComplaints ──────────────────────────────────────────────────────────

  describe('listComplaints', () => {
    it('delegates to complaint repository findAll', async () => {
      prismaMock.complaint.findMany.mockResolvedValue([]);
      prismaMock.complaint.count.mockResolvedValue(0);

      const result = await service.listComplaints({ page: 1, limit: 10 });
      expect(prismaMock.complaint.findMany).toHaveBeenCalled();
    });
  });
});
