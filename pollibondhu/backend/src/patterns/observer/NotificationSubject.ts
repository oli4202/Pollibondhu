import { PrismaClient } from '@prisma/client';
import { NotificationFactory } from '../factory/NotificationFactory';
import { logger } from '../singleton/Logger';

export interface AppEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}

export interface EventObserver {
  update(event: AppEvent, prisma: PrismaClient): Promise<void>;
}

export class NotificationSubject {
  private observers: EventObserver[] = [];

  attach(observer: EventObserver): void {
    this.observers.push(observer);
  }

  detach(observer: EventObserver): void {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  async notify(event: AppEvent, prisma: PrismaClient): Promise<void> {
    logger.info(`Notifying ${this.observers.length} observers for event: ${event.type}`);
    await Promise.all(this.observers.map((o) => o.update(event, prisma)));
  }
}

export class UserNotificationObserver implements EventObserver {
  async update(event: AppEvent, prisma: PrismaClient): Promise<void> {
    if (event.type === 'FORUM_POST_CREATED') {
      const { user_id } = event.payload;
      const interestedUsers = await prisma.savedService.findMany({
        where: { user_id: { not: user_id } },
        distinct: ['user_id'],
        select: { user_id: true },
        take: 50,
      });

      const notifications = interestedUsers.map((u) =>
        prisma.notification.create({
          data: {
            user_id: u.user_id,
            type: 'IN_APP',
            title: 'New Community Post',
            message: `A new post was created in a category you follow.`,
          },
        })
      );
      await Promise.all(notifications);
    }

    if (event.type === 'SERVICE_APPROVED') {
      const { provider_id, service_title } = event.payload;
      const notification = NotificationFactory.createNotification('IN_APP', {
        user_id: provider_id,
        title: 'Service Approved',
        message: `Your service "${service_title}" has been approved and is now live.`,
        metadata: { service_id: event.payload.service_id },
      });

      await prisma.notification.create({
        data: {
          user_id: provider_id,
          type: notification.getType() as any,
          title: notification.getContent().title,
          message: notification.getContent().message,
        },
      });
    }

    if (event.type === 'COMPLAINT_RESOLVED') {
      const { user_id, complaint_id } = event.payload;
      await prisma.notification.create({
        data: {
          user_id,
          type: 'IN_APP',
          title: 'Complaint Resolved',
          message: `Your complaint #${complaint_id} has been resolved.`,
        },
      });
    }
  }
}

export class AuditLogObserver implements EventObserver {
  async update(event: AppEvent, prisma: PrismaClient): Promise<void> {
    if (event.payload.admin_id) {
      await prisma.auditLog.create({
        data: {
          admin_id: event.payload.admin_id,
          action: event.type,
          entity_type: event.payload.entity_type || 'UNKNOWN',
          entity_id: event.payload.entity_id,
          details: JSON.stringify(event.payload),
        },
      });
    }
  }
}

export const appEventSubject = new NotificationSubject();
appEventSubject.attach(new UserNotificationObserver());
appEventSubject.attach(new AuditLogObserver());
