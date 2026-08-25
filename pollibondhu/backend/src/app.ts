import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './patterns/singleton/Logger';
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

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

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

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their personal notification room
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user room ${userId}`);
  });

  socket.on('join_department', (departmentId) => {
    socket.join(`dept_${departmentId}`);
    console.log(`Socket ${socket.id} joined department ${departmentId}`);
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
      const { conversationId, senderId, content, messageType, mediaUrl, mediaDuration, replyToId } = data;

      // Save to database
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

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

      await prisma.$disconnect();

      // Broadcast to all members in the room
      io.to(`chat_${conversationId}`).emit('chat:message', message);
    } catch (err: any) {
      console.error('Chat message error:', err.message);
      socket.emit('chat:error', { error: err.message });
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('chat:typing', {
      userId: data.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  });

  // Voice message streaming (sends audio chunks)
  socket.on('chat:voice_chunk', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('chat:voice_chunk', data);
  });

  // Voice message complete
  socket.on('chat:voice_complete', async (data) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const message = await prisma.chatMessage.create({
        data: {
          conversation_id: data.conversationId,
          sender_id: data.senderId,
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

      await prisma.$disconnect();

      io.to(`chat_${data.conversationId}`).emit('chat:message', message);
    } catch (err: any) {
      console.error('Voice message error:', err.message);
    }
  });

  // Channel post broadcast
  socket.on('channel:post', async (data) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const post = await prisma.channelPost.create({
        data: {
          conversation_id: data.conversationId,
          author_id: data.authorId,
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

      await prisma.$disconnect();

      io.to(`chat_${data.conversationId}`).emit('channel:post', post);
    } catch (err: any) {
      console.error('Channel post error:', err.message);
    }
  });

  // Channel comment
  socket.on('channel:comment', async (data) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const comment = await prisma.channelComment.create({
        data: { post_id: data.postId, user_id: data.userId, content: data.content },
        include: { user: { select: { full_name: true, avatar_url: true } } },
      });

      await prisma.channelPost.update({
        where: { post_id: data.postId },
        data: { comments_count: { increment: 1 } },
      });

      await prisma.$disconnect();

      io.to(`chat_${data.conversationId}`).emit('channel:comment', { ...comment, conversationId: data.conversationId });
    } catch (err: any) {
      console.error('Channel comment error:', err.message);
    }
  });

  // Join a channel room for live updates
  socket.on('channel:join', (conversationId) => {
    socket.join(`chat_${conversationId}`);
  });

  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Only start server when run directly (not imported by tests)
if (require.main === module || process.env.NODE_ENV === 'production') {
  server.listen(PORT, () => {
    logger.info(`🚀 PolliBondhu API & Socket.io running on port ${PORT}`);
  });
}

export default app;
