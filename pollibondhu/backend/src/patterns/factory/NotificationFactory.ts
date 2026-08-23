export interface NotificationPayload {
  user_id: number;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export abstract class Notification {
  protected payload: NotificationPayload;

  constructor(payload: NotificationPayload) {
    this.payload = payload;
  }

  abstract getType(): string;
  abstract getContent(): { title: string; message: string; metadata?: Record<string, any> };
}

export class InAppNotification extends Notification {
  getType(): string {
    return 'IN_APP';
  }

  getContent() {
    return {
      title: this.payload.title,
      message: this.payload.message,
      metadata: { ...this.payload.metadata, channel: 'in-app' },
    };
  }
}

export class EmailNotification extends Notification {
  getType(): string {
    return 'EMAIL';
  }

  getContent() {
    return {
      title: `[Email] ${this.payload.title}`,
      message: this.payload.message,
      metadata: { ...this.payload.metadata, channel: 'email', template: 'default' },
    };
  }
}

export class SystemAnnouncement extends Notification {
  getType(): string {
    return 'SYSTEM';
  }

  getContent() {
    return {
      title: `[System] ${this.payload.title}`,
      message: this.payload.message,
      metadata: { ...this.payload.metadata, channel: 'system', priority: 'high' },
    };
  }
}

/**
 * Factory Method Pattern: NotificationFactory
 * Problem: Creating different notification types (in-app, email, system)
 * requires conditional logic scattered across the codebase.
 * Solution: Centralized factory that encapsulates object creation logic.
 */
export class NotificationFactory {
  static createNotification(
    type: 'IN_APP' | 'EMAIL' | 'SYSTEM',
    payload: NotificationPayload
  ): Notification {
    switch (type) {
      case 'IN_APP':
        return new InAppNotification(payload);
      case 'EMAIL':
        return new EmailNotification(payload);
      case 'SYSTEM':
        return new SystemAnnouncement(payload);
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}
