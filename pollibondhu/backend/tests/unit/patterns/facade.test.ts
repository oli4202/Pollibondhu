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
      prismaMock.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80) // activeUsers
        .mockResolvedValueOnce(15); // totalProviders
      prismaMock.service.count
        .mockResolvedValueOnce(50) // totalServices
        .mockResolvedValueOnce(5); // pendingServices
      prismaMock.forumPost.count.mockResolvedValue(200);
      prismaMock.complaint.count.mockResolvedValue(3);
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 1, admin: { full_name: 'Admin' } },
      ] as any);

      const stats = await facade.getDashboardStats();

      expect(stats).toEqual({
        totalUsers: 100,
        activeUsers: 80,
        totalProviders: 15,
        totalServices: 50,
        pendingServices: 5,
        totalPosts: 200,
        pendingComplaints: 3,
        recentActivities: [{ id: 1, admin: { full_name: 'Admin' } }],
      });

      // Facade filtered by role / status on our behalf
      expect(prismaMock.user.count).toHaveBeenCalledWith({ where: { is_active: true } });
      expect(prismaMock.service.count).toHaveBeenCalledWith({ where: { status: 'PENDING' } });
      expect(prismaMock.complaint.count).toHaveBeenCalledWith({
        where: { status: { in: ['PENDING', 'REVIEWING'] } },
      });
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
});
