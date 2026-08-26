/**
 * Unit tests — FACTORY METHOD PATTERN
 * Verifies NotificationFactory creates the right product for each type token,
 * and rejects unknown types.
 */
import {
  NotificationFactory,
  InAppNotification,
  EmailNotification,
  SystemAnnouncement,
} from '../../../src/patterns/factory/NotificationFactory';

const payload = {
  user_id: 1,
  title: 'Service Approved',
  message: 'Your service is live',
  metadata: { service_id: 42 },
};

describe('Factory Method Pattern — NotificationFactory', () => {
  it('creates an InAppNotification for IN_APP', () => {
    const n = NotificationFactory.createNotification('IN_APP', payload);
    expect(n).toBeInstanceOf(InAppNotification);
    expect(n.getType()).toBe('IN_APP');
  });

  it('creates an EmailNotification for EMAIL', () => {
    const n = NotificationFactory.createNotification('EMAIL', payload);
    expect(n).toBeInstanceOf(EmailNotification);
    expect(n.getType()).toBe('EMAIL');
  });

  it('creates a SystemAnnouncement for SYSTEM', () => {
    const n = NotificationFactory.createNotification('SYSTEM', payload);
    expect(n).toBeInstanceOf(SystemAnnouncement);
    expect(n.getType()).toBe('SYSTEM');
  });

  it('throws on an unknown notification type', () => {
    // @ts-expect-error deliberately invalid type at runtime
    expect(() => NotificationFactory.createNotification('PIGEON', payload)).toThrow(
      'Unknown notification type: PIGEON'
    );
  });

  it('products shape their content per channel', () => {
    const inApp = NotificationFactory.createNotification('IN_APP', payload).getContent();
    expect(inApp.title).toBe('Service Approved');
    expect(inApp.metadata).toMatchObject({ channel: 'in-app', service_id: 42 });

    const email = NotificationFactory.createNotification('EMAIL', payload).getContent();
    expect(email.title).toBe('[Email] Service Approved');
    expect(email.metadata?.template).toBe('default');

    const system = NotificationFactory.createNotification('SYSTEM', payload).getContent();
    expect(system.title).toBe('[System] Service Approved');
    expect(system.metadata?.priority).toBe('high');
  });

  it('does not mutate the shared payload metadata', () => {
    NotificationFactory.createNotification('EMAIL', payload);
    NotificationFactory.createNotification('SYSTEM', payload);
    expect(payload.metadata).toEqual({ service_id: 42 });
  });
});
