/**
 * Unit tests — notification.util
 * Tests pushNotification and createAndPushNotification.
 * socket.ts and prisma singleton are mocked to isolate the utility.
 */
import { prismaMock } from '../../setup';
import * as socketUtil from '../../../src/utils/socket';

// Mock socket.io IO
jest.mock('../../../src/utils/socket', () => ({
  getIO: jest.fn(),
}));

// Import AFTER mocks are in place
import { pushNotification, createAndPushNotification } from '../../../src/utils/notification.util';

describe('notification.util', () => {
  // ─── pushNotification ────────────────────────────────────────────────────────

  describe('pushNotification', () => {
    it('sends via socket.io when IO is available', () => {
      const toMock = { emit: jest.fn() };
      const ioMock = { to: jest.fn().mockReturnValue(toMock) };
      (socketUtil.getIO as jest.Mock).mockReturnValue(ioMock);

      pushNotification(5, { id: 1, title: 'Test' });

      expect(ioMock.to).toHaveBeenCalledWith('user_5');
      expect(toMock.emit).toHaveBeenCalledWith('notification', { id: 1, title: 'Test' });
    });

    it('does not throw when socket IO is not initialized (null)', () => {
      (socketUtil.getIO as jest.Mock).mockReturnValue(null);
      expect(() => pushNotification(5, { id: 1 })).not.toThrow();
    });

    it('sends SSE when a client response stream exists for the user', () => {
      const mockWrite = jest.fn();
      (globalThis as any)._notificationClients = new Map([
        ['user_5', { write: mockWrite }],
      ]);
      (socketUtil.getIO as jest.Mock).mockReturnValue(null);

      pushNotification(5, { id: 2, title: 'SSE test' });

      expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('new_notification'));

      // Cleanup
      delete (globalThis as any)._notificationClients;
    });

    it('does not throw when SSE write fails', () => {
      const mockWrite = jest.fn().mockImplementation(() => { throw new Error('stream closed'); });
      (globalThis as any)._notificationClients = new Map([['user_5', { write: mockWrite }]]);
      (socketUtil.getIO as jest.Mock).mockReturnValue(null);

      expect(() => pushNotification(5, { id: 3 })).not.toThrow();

      delete (globalThis as any)._notificationClients;
    });

    it('does nothing when no SSE client is registered for the user', () => {
      (globalThis as any)._notificationClients = new Map(); // empty map, no user_5
      (socketUtil.getIO as jest.Mock).mockReturnValue(null);

      expect(() => pushNotification(5, { id: 4 })).not.toThrow();

      delete (globalThis as any)._notificationClients;
    });
  });

  // ─── createAndPushNotification ───────────────────────────────────────────────

  describe('createAndPushNotification', () => {
    it('creates a notification in the database and returns it', async () => {
      const created = { notification_id: 1, user_id: 5, type: 'APPLICATION', title: 'App Submitted', message: 'Your app was submitted.' };
      prismaMock.notification.create.mockResolvedValue(created as any);
      (socketUtil.getIO as jest.Mock).mockReturnValue(null);

      const result = await createAndPushNotification(5, 'APPLICATION', 'App Submitted', 'Your app was submitted.');

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: { user_id: 5, type: 'APPLICATION', title: 'App Submitted', message: 'Your app was submitted.' },
      });
      expect(result).toEqual(created);
    });
  });
});
