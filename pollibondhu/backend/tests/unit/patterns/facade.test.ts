/**
 * Unit tests — FACADE PATTERN
 * AdminDashboardFacade aggregates 6+ tables behind one call. The facade is
 * exercised against the shared deep prismaMock, verifying orchestration and
 * the unified DTO without a database.
 */
import { AdminDashboardFacade } from '../../../src/patterns/facade/AdminDashboardFacade';
import { prismaMock } from '../../setup';

describe('Facade Pattern — AdminDashboardFacade', () => {
  let facade: AdminDashboardFacade;

  beforeEach(() => {
    facade = new AdminDashboardFacade(prismaMock);
  });

  describe('getDashboardStats', () => {
    it('aggregates counts across all tables into one DTO', async () => {
      // The new facade calls: user.count (x2), providerComplaint.count, project.count,
      // providerComplaint.findMany, department.findMany, user.findMany
      prismaMock.user.count
        .mockResolvedValueOnce(500)    // CITIZEN count
        .mockResolvedValueOnce(20);    // active providers count
      prismaMock.providerComplaint.count.mockResolvedValue(3);
      prismaMock.project.count.mockResolvedValue(8);
      prismaMock.providerComplaint.findMany.mockResolvedValue([]);
      prismaMock.department.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([]);

      const stats = await facade.getDashboardStats();

      expect(stats.totalUsers).toBe(500);
      expect(stats.activeProviders).toBe(20);
      expect(stats.pendingEscalations).toBe(3);
      expect(stats.activeProjects).toBe(8);
      expect(stats).toHaveProperty('escalatedComplaints');
      expect(stats).toHaveProperty('providerPerformance');
      expect(stats).toHaveProperty('departmentStats');
      expect(stats).toHaveProperty('budgetOverview');
    });

    it('calculates department budget totals', async () => {
      prismaMock.user.count.mockResolvedValue(10);
      prismaMock.providerComplaint.count.mockResolvedValue(0);
      prismaMock.project.count.mockResolvedValue(2);
      prismaMock.providerComplaint.findMany.mockResolvedValue([]);
      prismaMock.department.findMany.mockResolvedValue([
        {
          department_id: 1,
          name: 'Health',
          _count: { applications: 5, projects: 2, complaints: 3 },
          projects: [
            { budget: 100000, spent: 40000, status: 'IN_PROGRESS' },
            { budget: 50000, spent: 50000, status: 'COMPLETED' },
          ],
        },
      ] as any);
      prismaMock.user.findMany.mockResolvedValue([]);

      const stats = await facade.getDashboardStats();

      expect(stats.departmentStats[0].budget).toBe(150000);
      expect(stats.departmentStats[0].spent).toBe(90000);
      expect(stats.departmentStats[0].remaining).toBe(60000);
      expect(stats.budgetOverview.totalAllocated).toBe(150000);
    });
  });

  describe('getGrowthMetrics', () => {
    it('returns grouped user and service growth series', async () => {
      (prismaMock.user.groupBy as unknown as jest.Mock).mockResolvedValue([{ _count: { user_id: 4 } }] as any);
      (prismaMock.service.groupBy as unknown as jest.Mock).mockResolvedValue([{ _count: { service_id: 2 } }] as any);

      const result = await facade.getGrowthMetrics(30);

      expect(result).toEqual([
        { label: 'User Growth', data: [{ _count: { user_id: 4 } }] },
        { label: 'Service Growth', data: [{ _count: { service_id: 2 } }] },
      ]);
      expect(prismaMock.user.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['created_at'],
          where: expect.objectContaining({ created_at: expect.anything() }),
        })
      );
    });
  });

  describe('getWeeklyStats', () => {
    it('counts the last 7 days of platform activity', async () => {
      prismaMock.user.count.mockResolvedValue(10);
      prismaMock.service.count.mockResolvedValue(4);
      prismaMock.complaint.count.mockResolvedValue(6);
      prismaMock.forumPost.count.mockResolvedValue(25);

      const stats = await facade.getWeeklyStats();

      expect(stats).toEqual({
        newUsers: 10,
        newServices: 4,
        resolvedComplaints: 6,
        newPosts: 25,
      });
      expect(prismaMock.complaint.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: 'RESOLVED' }),
      });
    });
  });

  describe('getSubAdminDashboardStats', () => {
    it('returns error when no departments assigned', async () => {
      prismaMock.userDepartment.findMany.mockResolvedValue([]);
      const result = await facade.getSubAdminDashboardStats(7);
      expect(result).toHaveProperty('error');
    });

    it('returns aggregated stats for assigned departments', async () => {
      prismaMock.userDepartment.findMany.mockResolvedValue([
        { department_id: 1, department: { name: 'Agriculture' } },
      ] as any);
      prismaMock.userDepartment.count.mockResolvedValue(5);
      (prismaMock.complaint.groupBy as unknown as jest.Mock).mockResolvedValue([
        { status: 'PENDING', _count: 3 },
        { status: 'RESOLVED', _count: 2 },
      ]);
      (prismaMock.application.groupBy as unknown as jest.Mock).mockResolvedValue([
        { status: 'SUBMITTED', _count: 4 },
        { status: 'APPROVED', _count: 1 },
      ]);
      prismaMock.project.findMany.mockResolvedValue([]);

      const result = await facade.getSubAdminDashboardStats(7);

      expect(result.departments).toBe('Agriculture');
      expect(result.officers).toBe(5);
      expect(result.complaints.total).toBe(5);
      expect(result.complaints.resolved).toBe(2);
      expect(result.applications.total).toBe(5);
      expect(result.applications.approved).toBe(1);
    });
  });

  describe('getOfficerDashboardStats', () => {
    it('returns task, application, complaint, and message counts for an officer', async () => {
      prismaMock.project.count.mockResolvedValue(3);
      prismaMock.complaint.count.mockResolvedValue(2);
      prismaMock.message.count.mockResolvedValue(4);
      prismaMock.application.count.mockResolvedValue(7);

      const result = await facade.getOfficerDashboardStats(10);

      expect(result).toEqual({ tasks: 3, applications: 7, complaints: 2, messages: 4 });
    });
  });
});
