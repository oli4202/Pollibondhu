/**
 * Unit tests — OBSERVER PATTERN
 * The subject's subscribe/notify machinery is tested with stub observers;
 * the concrete observers are tested against the shared deep prismaMock so
 * no database is touched.
 */
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import {
  NotificationSubject,
  UserNotificationObserver,
  AuditLogObserver,
  appEventSubject,
} from '../../../src/patterns/observer/NotificationSubject';
import { logger } from '../../../src/patterns/singleton/Logger';
import { prismaMock } from '../../setup';

const makeEvent = (type: string, payload: Record<string, any> = {}) => ({
  type,
  payload,
  timestamp: new Date(),
});

describe('Observer Pattern — NotificationSubject', () => {
  it('notifies every attached observer', async () => {
    const subject = new NotificationSubject();
    const a = { update: jest.fn().mockResolvedValue(undefined) };
    const b = { update: jest.fn().mockResolvedValue(undefined) };
    subject.attach(a as any);
    subject.attach(b as any);

    const event = makeEvent('SOMETHING_HAPPENED');
    await subject.notify(event, prismaMock);

    expect(a.update).toHaveBeenCalledWith(event, prismaMock);
    expect(b.update).toHaveBeenCalledWith(event, prismaMock);
  });

  it('detach removes an observer so it is no longer notified', async () => {
    const subject = new NotificationSubject();
    const observer = { update: jest.fn().mockResolvedValue(undefined) };
    subject.attach(observer as any);
    subject.detach(observer as any);

    await subject.notify(makeEvent('EVENT'), prismaMock);
    expect(observer.update).not.toHaveBeenCalled();
  });

  it('logs how many observers were notified', async () => {
    const subject = new NotificationSubject();
    subject.attach({ update: jest.fn() } as any);
    subject.attach({ update: jest.fn() } as any);

    await subject.notify(makeEvent('EVENT'), prismaMock);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Notifying 2 observers'));
  });

  it('the application ships with both concrete observers pre-attached', () => {
    expect(appEventSubject).toBeInstanceOf(NotificationSubject);
    // Internal array has exactly UserNotificationObserver + AuditLogObserver
    // @ts-ignore access private for verification
    expect(appEventSubject['observers']).toHaveLength(2);
  });
});

describe('Observer Pattern — UserNotificationObserver', () => {
  let observer: UserNotificationObserver;

  beforeEach(() => {
    observer = new UserNotificationObserver();
  });

  it('creates notifications for interested users on FORUM_POST_CREATED', async () => {
    prismaMock.savedService.findMany.mockResolvedValue([
      { user_id: 2 },
      { user_id: 3 },
    ] as any);
    prismaMock.notification.create.mockResolvedValue({} as any);

    await observer.update(makeEvent('FORUM_POST_CREATED', { user_id: 1 }), prismaMock);

    expect(prismaMock.savedService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: { not: 1 } },
        distinct: ['user_id'],
      })
    );
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 2,
        type: 'IN_APP',
        title: 'New Community Post',
      }),
    });
  });

  it('ignores unrelated events', async () => {
    await observer.update(makeEvent('UNRELATED_EVENT'), prismaMock);
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  it('notifies the provider via the factory product on SERVICE_APPROVED', async () => {
    prismaMock.notification.create.mockResolvedValue({} as any);

    await observer.update(
      makeEvent('SERVICE_APPROVED', {
        provider_id: 7,
        service_id: 42,
        service_title: 'Tractor Rental',
      }),
      prismaMock
    );

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 7,
        type: 'IN_APP',
        title: 'Service Approved',
        message: 'Your service "Tractor Rental" has been approved and is now live.',
      }),
    });
  });

  it('notifies the citizen on COMPLAINT_RESOLVED', async () => {
    prismaMock.notification.create.mockResolvedValue({} as any);

    await observer.update(
      makeEvent('COMPLAINT_RESOLVED', { user_id: 5, complaint_id: 99 }),
      prismaMock
    );

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 5,
        title: 'Complaint Resolved',
        message: 'Your complaint #99 has been resolved.',
      }),
    });
  });
});

describe('Observer Pattern — AuditLogObserver', () => {
  it('writes an audit log entry when an admin performed the action', async () => {
    const observer = new AuditLogObserver();
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await observer.update(
      makeEvent('SERVICE_APPROVED', {
        admin_id: 1,
        entity_type: 'SERVICE',
        entity_id: 42,
      }),
      prismaMock
    );

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        admin_id: 1,
        action: 'SERVICE_APPROVED',
        entity_type: 'SERVICE',
        entity_id: 42,
      }),
    });
  });

  it('does nothing when no admin triggered the event', async () => {
    const observer = new AuditLogObserver();
    await observer.update(makeEvent('FORUM_POST_CREATED', { user_id: 3 }), prismaMock);
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});
