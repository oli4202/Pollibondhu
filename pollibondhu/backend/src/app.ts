import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './patterns/singleton/Logger';
import { prisma } from './patterns/singleton/DatabaseManager';
import { verifyAccessToken } from './utils/jwt';
import { setIO } from './utils/socket';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import complaintRoutes from './routes/complaint.routes';
import adminRoutes from './routes/admin.routes';
import agricultureRoutes from './routes/agriculture.routes';
import applicationRoutes from './routes/application.routes';
import uploadRoutes from './routes/upload.routes';
import aiRoutes from './routes/aiRoutes';
import educationRoutes from './routes/education.routes';
import listingRoutes from './routes/listing.routes';
import priceAlertRoutes from './routes/priceAlert.routes';
import ngoRoutes from './routes/ngo.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import communityRoutes from './routes/community.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General API limiter — generous allowance so background polling, chat and
// uploads don't exhaust the budget and block real user actions with 429s.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Strict limiter only for auth endpoints (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'PolliBondhu API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agriculture', agricultureRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/price-alerts', priceAlertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/community', communityRoutes);

app.use(errorMiddleware);
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register io with singleton so route handlers can access it without circular deps
setIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required: no token provided'));
  }
  try {
    const payload = verifyAccessToken(token);
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Authentication failed: invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  logger.info(`User ${user.user_id} connected (socket ${socket.id})`);

  // Auto-join personal notification room
  socket.join(`user_${user.user_id}`);

  // Join community room for real-time posts
  socket.on('community:join', () => {
    socket.join('community');
  });

  socket.on('join_department', (departmentId) => {
    socket.join(`dept_${departmentId}`);
  });

  // ============================================
  // REAL-TIME CHAT SYSTEM
  // ============================================

  // Join a chat conversation room
  socket.on('chat:join', (conversationId) => {
    socket.join(`chat_${conversationId}`);
    console.log(`Socket ${socket.id} joined chat room ${conversationId}`);
  });

  // Leave a chat conversation room
  socket.on('chat:leave', (conversationId) => {
    socket.leave(`chat_${conversationId}`);
  });

  // Send a chat message
  socket.on('chat:message', async (data) => {
    try {
      const senderId = user.user_id;
      const { conversationId, content, messageType, mediaUrl, mediaDuration, replyToId } = data;

      // Verify membership
      const member = await prisma.chatMember.findUnique({
        where: { conversation_id_user_id: { conversation_id: conversationId, user_id: senderId } },
      });
      if (!member) {
        socket.emit('chat:error', { error: 'Not a member of this conversation' });
        return;
      }

      const message = await prisma.chatMessage.create({
        data: {
          conversation_id: conversationId,
          sender_id: senderId,
          content: content || null,
          message_type: messageType || 'TEXT',
          media_url: mediaUrl || null,
          media_duration: mediaDuration || null,
          reply_to_id: replyToId || null,
        },
        include: {
          sender: { select: { user_id: true, full_name: true, avatar_url: true, role: true } },
        },
      });

      // Update conversation timestamp
      await prisma.chatConversation.update({
        where: { conversation_id: conversationId },
        data: { updated_at: new Date() },
      });

      // Broadcast to all members in the room (sender included for delivery confirmation)
      io.to(`chat_${conversationId}`).emit('chat:message', message);
    } catch (err: any) {
      console.error('Chat message error:', err.message);
      socket.emit('chat:error', { error: err.message });
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('chat:typing', {
      userId: user.user_id,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  });

  // Mark messages as read and broadcast read receipts
  socket.on('chat:read', async (data) => {
    try {
      const { conversationId } = data;
      const now = new Date();

      // Update last_read_at
      await prisma.chatMember.update({
        where: { conversation_id_user_id: { conversation_id: conversationId, user_id: user.user_id } },
        data: { last_read_at: now },
      }).catch(() => {});

      // Create MessageRead records for unread messages
      const unreadMessages = await prisma.chatMessage.findMany({
        where: {
          conversation_id: conversationId,
          sender_id: { not: user.user_id },
          is_deleted: false,
          reads: { none: { user_id: user.user_id } },
        },
        select: { message_id: true },
      });

      if (unreadMessages.length > 0) {
        await prisma.messageRead.createMany({
          data: unreadMessages.map((msg) => ({
            message_id: msg.message_id,
            user_id: user.user_id,
          })),
        }).catch(() => {}); // Ignore duplicate key errors
      }

      // Broadcast read receipt to other members
      socket.to(`chat_${conversationId}`).emit('chat:read', {
        userId: user.user_id,
        conversationId,
        readAt: now,
      });
    } catch (err: any) {
      console.error('Chat read error:', err.message);
    }
  });

  // Voice message streaming (sends audio chunks)
  socket.on('chat:voice_chunk', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('chat:voice_chunk', data);
  });

  // Voice message complete
  socket.on('chat:voice_complete', async (data) => {
    try {
      const senderId = user.user_id;

      // Verify membership
      const member = await prisma.chatMember.findUnique({
        where: { conversation_id_user_id: { conversation_id: data.conversationId, user_id: senderId } },
      });
      if (!member) {
        socket.emit('chat:error', { error: 'Not a member of this conversation' });
        return;
      }

      const message = await prisma.chatMessage.create({
        data: {
          conversation_id: data.conversationId,
          sender_id: senderId,
          message_type: 'VOICE',
          media_url: data.mediaUrl,
          media_duration: data.duration || null,
        },
        include: {
          sender: { select: { user_id: true, full_name: true, avatar_url: true, role: true } },
        },
      });

      await prisma.chatConversation.update({
        where: { conversation_id: data.conversationId },
        data: { updated_at: new Date() },
      });

      io.to(`chat_${data.conversationId}`).emit('chat:message', message);
    } catch (err: any) {
      console.error('Voice message error:', err.message);
    }
  });

  // Channel post broadcast
  socket.on('channel:post', async (data) => {
    try {
      const authorId = user.user_id;

      // Verify membership
      const member = await prisma.chatMember.findUnique({
        where: { conversation_id_user_id: { conversation_id: data.conversationId, user_id: authorId } },
      });
      if (!member) {
        socket.emit('chat:error', { error: 'Not a member of this channel' });
        return;
      }

      const post = await prisma.channelPost.create({
        data: {
          conversation_id: data.conversationId,
          author_id: authorId,
          title: data.title || null,
          content: data.content,
          post_type: data.postType || 'UPDATE',
          media_url: data.mediaUrl || null,
          media_type: data.mediaType || null,
        },
        include: {
          author: { select: { user_id: true, full_name: true, avatar_url: true, role: true } },
        },
      });

      await prisma.chatConversation.update({
        where: { conversation_id: data.conversationId },
        data: { updated_at: new Date() },
      });

      io.to(`chat_${data.conversationId}`).emit('channel:post', post);
    } catch (err: any) {
      console.error('Channel post error:', err.message);
    }
  });

  // Channel comment
  socket.on('channel:comment', async (data) => {
    try {
      const comment = await prisma.channelComment.create({
        data: { post_id: data.postId, user_id: user.user_id, content: data.content },
        include: { user: { select: { full_name: true, avatar_url: true } } },
      });

      await prisma.channelPost.update({
        where: { post_id: data.postId },
        data: { comments_count: { increment: 1 } },
      });

      io.to(`chat_${data.conversationId}`).emit('channel:comment', { ...comment, conversationId: data.conversationId });
    } catch (err: any) {
      console.error('Channel comment error:', err.message);
    }
  });

  // Join a channel room for live updates
  socket.on('channel:join', (conversationId) => {
    socket.join(`chat_${conversationId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`User ${user.user_id} disconnected (socket ${socket.id})`);
  });
});

// Only start server when run directly (not imported by tests)
if (require.main === module || process.env.NODE_ENV === 'production') {
  server.listen(PORT, () => {
    logger.info(`🚀 PolliBondhu API & Socket.io running on port ${PORT}`);
  });
}

export default app;
