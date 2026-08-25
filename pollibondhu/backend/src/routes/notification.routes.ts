import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const router = Router();

// Helper: push notification via SSE and Socket.io
function pushNotification(userId: number, notification: any) {
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
    const { io } = require('../app');
    io?.to(`user_${userId}`).emit('notification', notification);
  } catch {}
}

// Helper: create notification and push
async function createAndPush(userId: number, type: string, title: string, message: string) {
  const notification = await (prisma as any).notification.create({
    data: { user_id: userId, type, title, message },
  });
  pushNotification(userId, notification);
  return notification;
}

// Get all notifications for the authenticated user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const notifications = await (prisma as any).notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    sendSuccess(res, { notifications });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const count = await (prisma as any).notification.count({
      where: { user_id: userId, is_read: false },
    });

    sendSuccess(res, { count });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// SSE endpoint for live notifications
router.get('/stream', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  if (!userId) { res.status(401).end(); return; }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  // Store the response object for this user
  const clientKey = `user_${userId}`;
  if (!globalThis._notificationClients) globalThis._notificationClients = new Map();
  globalThis._notificationClients.set(clientKey, res);

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`); } catch {}
  }, 30000);

  // Poll for new notifications every 10s (lightweight fallback)
  const poll = setInterval(async () => {
    try {
      const count = await (prisma as any).notification.count({
        where: { user_id: userId, is_read: false },
      });
      res.write(`data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`);
    } catch {}
  }, 10000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(poll);
    globalThis._notificationClients?.delete(clientKey);
  });
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const notificationId = parseInt(req.params.id);
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    await (prisma as any).notification.updateMany({
      where: { notification_id: notificationId, user_id: userId },
      data: { is_read: true },
    });

    sendSuccess(res, null, 'Marked as read');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    await (prisma as any).notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Create notification (any authenticated user can create for system actions)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { user_id, type, title, message } = req.body;
    if (!user_id || !type || !title || !message) {
      sendError(res, 'user_id, type, title, message are required', 400);
      return;
    }

    const notification = await createAndPush(user_id, type, title, message);
    sendSuccess(res, notification, 'Notification created', 201);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Broadcast notification to all users (admin only)
router.post('/broadcast', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, title, message } = req.body;
    if (!type || !title || !message) {
      sendError(res, 'type, title, message are required', 400);
      return;
    }

    const users = await (prisma as any).user.findMany({ where: { is_active: true }, select: { user_id: true } });
    const notifications = await Promise.all(
      users.map((u: any) => createAndPush(u.user_id, type, title, message))
    );

    sendSuccess(res, { count: notifications.length }, 'Broadcast sent');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Type augmentation for global notification clients
declare global {
  var _notificationClients: Map<string, any> | undefined;
}

export default router;
