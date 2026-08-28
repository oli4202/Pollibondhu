import { prisma } from '../patterns/singleton/DatabaseManager';
import { getIO } from './socket';

export function pushNotification(userId: number, notification: any) {
  // SSE push
  const clientKey = `user_${userId}`;
  const clientRes = (globalThis as any)._notificationClients?.get(clientKey);
  if (clientRes) {
    try {
      clientRes.write(`data: ${JSON.stringify({ type: 'new_notification', notification })}\n\n`);
    } catch {}
  }
  // Socket.io push
  try {
    getIO()?.to(`user_${userId}`).emit('notification', notification);
  } catch {}
}

export async function createAndPushNotification(userId: number, type: string, title: string, message: string) {
  const notification = await prisma.notification.create({
    data: { user_id: userId, type, title, message },
  });
  pushNotification(userId, notification);
  return notification;
}
