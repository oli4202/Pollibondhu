import { DatabaseManager } from '../../src/patterns/singleton/DatabaseManager';
import { Logger } from '../../src/patterns/singleton/Logger';
import { NotificationFactory } from '../../src/patterns/factory/NotificationFactory';
import { SearchContext, ServiceSearchStrategy, CropSearchStrategy } from '../../src/patterns/strategy/SearchStrategy';
import { NotificationSubject, UserNotificationObserver, AuditLogObserver } from '../../src/patterns/observer/NotificationSubject';
import { AdminDashboardFacade } from '../../src/patterns/facade/AdminDashboardFacade';
import { prismaMock } from '../setup';

describe('Design Patterns', () => {
  describe('Singleton Pattern', () => {
    it('DatabaseManager should return same instance', () => {
      const db1 = DatabaseManager.getInstance();
      const db2 = DatabaseManager.getInstance();
      expect(db1).toBe(db2);
    });

    it('Logger should return same instance', () => {
      const log1 = Logger.getInstance();
      const log2 = Logger.getInstance();
      expect(log1).toBe(log2);
    });
  });

  describe('Factory Method Pattern', () => {
    it('should create InApp notification', () => {
      const notif = NotificationFactory.createNotification('IN_APP', { user_id: 1, title: 'Test', message: 'Hello' });
      expect(notif.getType()).toBe('IN_APP');
      expect(notif.getContent().title).toBe('Test');
    });

    it('should create Email notification with email prefix', () => {
      const notif = NotificationFactory.createNotification('EMAIL', { user_id: 1, title: 'Test', message: 'Hello' });
      expect(notif.getType()).toBe('EMAIL');
      expect(notif.getContent().title).toContain('[Email]');
    });

    it('should create System announcement with high priority', () => {
      const notif = NotificationFactory.createNotification('SYSTEM', { user_id: 1, title: 'Alert', message: 'System down' });
      expect(notif.getType()).toBe('SYSTEM');
      expect(notif.getContent().metadata?.priority).toBe('high');
    });

    it('should throw for unknown type', () => {
      expect(() => NotificationFactory.createNotification('UNKNOWN' as any, { user_id: 1, title: 'X', message: 'Y' }))
        .toThrow('Unknown notification type');
    });
  });

  describe('Strategy Pattern', () => {
    it('ServiceSearchStrategy should search services', async () => {
      prismaMock.service.findMany.mockResolvedValue([]);
      prismaMock.service.count.mockResolvedValue(0);

      const strategy = new ServiceSearchStrategy();
      const result = await strategy.search({ query: 'tractor' }, prismaMock as any);

      expect(result.data).toEqual([]);
      expect(prismaMock.service.findMany).toHaveBeenCalled();
    });

    it('SearchContext should allow strategy switching', async () => {
      prismaMock.crop.findMany.mockResolvedValue([]);
      prismaMock.crop.count.mockResolvedValue(0);

      const context = new SearchContext(new ServiceSearchStrategy());
      context.setStrategy(new CropSearchStrategy());
      const result = await context.execute({ query: 'rice' }, prismaMock as any);

      expect(prismaMock.crop.findMany).toHaveBeenCalled();
    });
  });

  describe('Observer Pattern', () => {
    it('should notify all observers', async () => {
      const subject = new NotificationSubject();
      const observer1 = { update: jest.fn() };
      const observer2 = { update: jest.fn() };

      subject.attach(observer1);
      subject.attach(observer2);

      await subject.notify({ type: 'TEST', payload: {}, timestamp: new Date() }, prismaMock as any);

      expect(observer1.update).toHaveBeenCalled();
      expect(observer2.update).toHaveBeenCalled();
    });

    it('UserNotificationObserver should create notification on SERVICE_APPROVED', async () => {
      const observer = new UserNotificationObserver();
      prismaMock.notification.create.mockResolvedValue({} as any);

      await observer.update(
        { type: 'SERVICE_APPROVED', payload: { provider_id: 1, service_title: 'Test', service_id: 1, admin_id: 2, entity_type: 'SERVICE', entity_id: 1 }, timestamp: new Date() },
        prismaMock as any
      );

      expect(prismaMock.notification.create).toHaveBeenCalled();
    });

    it('AuditLogObserver should create audit log when admin_id present', async () => {
      const observer = new AuditLogObserver();
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await observer.update(
        { type: 'TEST', payload: { admin_id: 1, entity_type: 'USER', entity_id: 1 }, timestamp: new Date() },
        prismaMock as any
      );

      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Facade Pattern', () => {
    it('should aggregate dashboard stats from multiple tables', async () => {
      prismaMock.user.count.mockResolvedValue(100);
      prismaMock.service.count.mockResolvedValue(50);
      prismaMock.complaint.count.mockResolvedValue(10);
      prismaMock.auditLog.findMany.mockResolvedValue([]);

      const facade = new AdminDashboardFacade(prismaMock as any);
      const stats = await facade.getDashboardStats();

      expect(stats.totalUsers).toBe(100);
      expect(stats.totalServices).toBe(50);
      expect(stats.pendingComplaints).toBe(10);
    });

    it('should return weekly stats', async () => {
      prismaMock.user.count.mockResolvedValue(5);
      prismaMock.service.count.mockResolvedValue(3);
      prismaMock.complaint.count.mockResolvedValue(2);
      prismaMock.forumPost.count.mockResolvedValue(8);

      const facade = new AdminDashboardFacade(prismaMock as any);
      const stats = await facade.getWeeklyStats();

      expect(stats.newUsers).toBe(5);
      expect(stats.newServices).toBe(3);
    });
  });
});
