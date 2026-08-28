import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { chatUpload } from '../utils/upload';
import { getIO } from '../utils/socket';

const router = Router();

// ============================================
// CONVERSATIONS (1-on-1, groups, channels)
// ============================================

// List all conversations for the authenticated user
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const members = await (prisma as any).chatMember.findMany({
      where: { user_id: userId },
      include: {
        conversation: {
          include: {
            members: { include: { user: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } } },
            messages: { orderBy: { created_at: 'desc' }, take: 1, include: { sender: { select: { full_name: true } } } },
            provider: { select: { full_name: true, role: true } },
          },
        },
      },
      orderBy: { conversation: { updated_at: 'desc' } },
    });

    // Compute real unread counts for each conversation
    const conversations = await Promise.all(members.map(async (m: any) => {
      let unreadCount = 0;
      const lastRead = m.last_read_at;

      if (lastRead) {
        // Count messages sent by others since last read
        unreadCount = await (prisma as any).chatMessage.count({
          where: {
            conversation_id: m.conversation_id,
            sender_id: { not: userId },
            created_at: { gt: lastRead },
            is_deleted: false,
          },
        });
      } else {
        // Never read — count all messages from others
        unreadCount = await (prisma as any).chatMessage.count({
          where: {
            conversation_id: m.conversation_id,
            sender_id: { not: userId },
            is_deleted: false,
          },
        });
      }

      return {
        ...m.conversation,
        my_role: m.role,
        last_message: m.conversation.messages[0] || null,
        unread_count: unreadCount,
      };
    }));

    sendSuccess(res, conversations);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Create a direct (1-on-1) conversation
router.post('/conversations/direct', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { user_id: targetUserId } = req.body;
    if (!targetUserId) { sendError(res, 'user_id required', 400); return; }

    // Check if direct conversation already exists
    const myMemberships = await (prisma as any).chatMember.findMany({
      where: { user_id: userId, conversation: { type: 'DIRECT' } },
      include: { conversation: { include: { members: true } } },
    });

    for (const m of myMemberships) {
      if (m.conversation.members.some((mem: any) => mem.user_id === targetUserId && mem.user_id !== userId)) {
        sendSuccess(res, m.conversation, 'Existing conversation');
        return;
      }
    }

    const conversation = await (prisma as any).chatConversation.create({
      data: {
        type: 'DIRECT',
        created_by: userId,
        members: {
          create: [
            { user_id: userId, role: 'OWNER' },
            { user_id: targetUserId, role: 'MEMBER' },
          ],
        },
      },
      include: { members: { include: { user: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } } } },
    });

    sendSuccess(res, conversation, 'Conversation created', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Create a group conversation
router.post('/conversations/group', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { name, description, member_ids } = req.body;
    if (!name) { sendError(res, 'Group name required', 400); return; }

    const allMembers = [userId, ...(member_ids || [])];
    const uniqueMembers = [...new Set(allMembers)];

    const conversation = await (prisma as any).chatConversation.create({
      data: {
        type: 'GROUP',
        name,
        description,
        created_by: userId,
        members: {
          create: uniqueMembers.map((id: number) => ({
            user_id: id,
            role: id === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: { members: { include: { user: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } } } },
    });

    sendSuccess(res, conversation, 'Group created', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Create a channel (like Telegram/WhatsApp channels — provider broadcasts)
router.post('/conversations/channel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { name, description, service_id } = req.body;
    if (!name) { sendError(res, 'Channel name required', 400); return; }

    const conversation = await (prisma as any).chatConversation.create({
      data: {
        type: 'CHANNEL',
        name,
        description,
        created_by: userId,
        provider_id: userId,
        service_id: service_id || null,
        members: {
          create: { user_id: userId, role: 'OWNER' },
        },
      },
      include: {
        members: { include: { user: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } } },
        service: { select: { title: true } },
      },
    });

    sendSuccess(res, conversation, 'Channel created', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Join a channel
router.post('/conversations/:id/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const conversationId = parseInt(req.params.id);

    const existing = await (prisma as any).chatMember.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (existing) { sendSuccess(res, existing, 'Already a member'); return; }

    const member = await (prisma as any).chatMember.create({
      data: { conversation_id: conversationId, user_id: userId, role: 'MEMBER' },
    });

    sendSuccess(res, member, 'Joined channel', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// List channels (public)
router.get('/channels', authMiddleware, async (req: Request, res: Response) => {
  try {
    const channels = await (prisma as any).chatConversation.findMany({
      where: { type: 'CHANNEL', is_active: true },
      include: {
        provider: { select: { full_name: true, role: true, avatar_url: true } },
        service: { select: { title: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    sendSuccess(res, channels);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// List available providers (for 1-on-1 chat)
router.get('/providers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const providers = await (prisma as any).user.findMany({
      where: {
        is_active: true,
        role: { in: ['SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER', 'OFFICER', 'NGO_ADMIN'] },
      },
      select: { user_id: true, full_name: true, role: true, avatar_url: true, district: true },
    });
    sendSuccess(res, providers);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// List all users (for group creation)
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const users = await (prisma as any).user.findMany({
      where: { is_active: true, user_id: { not: userId } },
      select: { user_id: true, full_name: true, role: true, avatar_url: true, district: true },
      take: 100,
    });
    sendSuccess(res, users);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// ============================================
// MESSAGES
// ============================================

// Get messages for a conversation
router.get('/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await (prisma as any).chatMessage.findMany({
      where: { conversation_id: conversationId, is_deleted: false },
      include: {
        sender: { select: { user_id: true, full_name: true, avatar_url: true, role: true } },
        reply_to: { select: { message_id: true, content: true, sender: { select: { full_name: true } } } },
        reads: { select: { user_id: true, read_at: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    sendSuccess(res, messages.reverse());
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Send a message (REST fallback — primary is via WebSocket)
router.post('/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const conversationId = parseInt(req.params.id);
    const { content, message_type, media_url, reply_to_id } = req.body;

    // Verify membership
    const member = await (prisma as any).chatMember.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!member) { sendError(res, 'Not a member of this conversation', 403); return; }

    const message = await (prisma as any).chatMessage.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: message_type || 'TEXT',
        media_url,
        reply_to_id: reply_to_id || null,
      },
      include: { sender: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } },
    });

    // Update conversation timestamp
    await (prisma as any).chatConversation.update({
      where: { conversation_id: conversationId },
      data: { updated_at: new Date() },
    });

    sendSuccess(res, message, 'Message sent', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Edit a message
router.put('/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const messageId = parseInt(req.params.id);
    const { content } = req.body;

    const message = await (prisma as any).chatMessage.findUnique({ where: { message_id: messageId } });
    if (!message) { sendError(res, 'Message not found', 404); return; }
    if (message.sender_id !== userId) { sendError(res, 'Unauthorized', 403); return; }
    if (message.is_deleted) { sendError(res, 'Message deleted', 400); return; }

    const updated = await (prisma as any).chatMessage.update({
      where: { message_id: messageId },
      data: { content },
      include: { sender: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } },
    });

    getIO()?.to(`chat_${message.conversation_id}`).emit('chat:edit', updated);
    sendSuccess(res, updated, 'Message edited');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Delete a message
router.delete('/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const messageId = parseInt(req.params.id);

    const message = await (prisma as any).chatMessage.findUnique({ where: { message_id: messageId } });
    if (!message) { sendError(res, 'Message not found', 404); return; }
    if (message.sender_id !== userId) { sendError(res, 'Unauthorized', 403); return; }

    const deleted = await (prisma as any).chatMessage.update({
      where: { message_id: messageId },
      data: { is_deleted: true, content: 'This message was deleted', media_url: null },
      include: { sender: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } },
    });

    getIO()?.to(`chat_${message.conversation_id}`).emit('chat:delete', deleted);
    sendSuccess(res, deleted, 'Message deleted');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Mark messages as read in a conversation
router.post('/conversations/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const conversationId = parseInt(req.params.id);

    // Verify membership
    const member = await (prisma as any).chatMember.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!member) { sendError(res, 'Not a member of this conversation', 403); return; }

    const now = new Date();

    // Update last_read_at on the member record
    await (prisma as any).chatMember.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { last_read_at: now },
    });

    // Find all unread messages from others and create MessageRead records
    const unreadMessages = await (prisma as any).chatMessage.findMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        is_deleted: false,
        reads: { none: { user_id: userId } },
        ...(member.last_read_at ? { created_at: { gt: member.last_read_at } } : {}),
      },
      select: { message_id: true },
    });

    if (unreadMessages.length > 0) {
      await (prisma as any).messageRead.createMany({
        data: unreadMessages.map((msg: any) => ({
          message_id: msg.message_id,
          user_id: userId,
        })),
      }).catch(() => {}); // Ignore duplicate key errors
    }

    sendSuccess(res, { marked_read: unreadMessages.length }, 'Messages marked as read');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Get read receipts for messages in a conversation
router.get('/conversations/:id/read-receipts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);

    // Get all read records for messages in this conversation
    const reads = await (prisma as any).messageRead.findMany({
      where: {
        message: { conversation_id: conversationId },
      },
      select: {
        message_id: true,
        user_id: true,
        read_at: true,
      },
    });

    sendSuccess(res, reads);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Upload a file for a chat conversation
router.post('/conversations/:id/upload', authMiddleware, (req: Request, res: Response) => {
  const conversationId = parseInt(req.params.id);
  const userId = (req as any).user?.user_id;

  chatUpload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File too large. Maximum size is 10MB.', 400);
        }
        return sendError(res, err.message, 400);
      }
      return sendError(res, err.message, 400);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    try {
      // Verify membership
      const member = await (prisma as any).chatMember.findUnique({
        where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      });
      if (!member) {
        return sendError(res, 'Not a member of this conversation', 403);
      }

      const fileUrl = `/uploads/chat/${req.file.filename}`;

      sendSuccess(res, {
        file_url: fileUrl,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      }, 'File uploaded successfully', 201);
    } catch (e: any) {
      sendError(res, e.message, 500);
    }
  });
});

// ============================================
// CHANNEL POSTS (Telegram-like)
// ============================================

// Get channel posts
router.get('/conversations/:id/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const posts = await (prisma as any).channelPost.findMany({
      where: { conversation_id: conversationId },
      include: {
        author: { select: { user_id: true, full_name: true, avatar_url: true, role: true } },
        comments: { include: { user: { select: { full_name: true, avatar_url: true } } }, orderBy: { created_at: 'desc' } },
      },
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
    });
    sendSuccess(res, posts);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Create a channel post
router.post('/conversations/:id/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const conversationId = parseInt(req.params.id);
    const { title, content, post_type, media_url, media_type } = req.body;

    // Verify membership
    const member = await (prisma as any).chatMember.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!member) { sendError(res, 'Not a member', 403); return; }

    const post = await (prisma as any).channelPost.create({
      data: {
        conversation_id: conversationId,
        author_id: userId,
        title,
        content,
        post_type: post_type || 'UPDATE',
        media_url,
        media_type,
      },
      include: { author: { select: { user_id: true, full_name: true, avatar_url: true, role: true } } },
    });

    sendSuccess(res, post, 'Post created', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Comment on a channel post
router.post('/posts/:id/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    const comment = await (prisma as any).channelComment.create({
      data: { post_id: postId, user_id: userId, content },
      include: { user: { select: { full_name: true, avatar_url: true } } },
    });

    await (prisma as any).channelPost.update({
      where: { post_id: postId },
      data: { comments_count: { increment: 1 } },
    });

    sendSuccess(res, comment, 'Comment added', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// ============================================
// PROVIDER COMPLAINTS
// ============================================

// File a complaint to a provider
router.post('/complaints', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { provider_id, service_id, subject, description, category, priority } = req.body;
    if (!provider_id || !subject || !description) {
      sendError(res, 'provider_id, subject, description required', 400); return;
    }

    // Auto-create a conversation for this complaint
    const conversation = await (prisma as any).chatConversation.create({
      data: {
        type: 'DIRECT',
        name: `Complaint: ${subject}`,
        created_by: userId,
        members: {
          create: [
            { user_id: userId, role: 'OWNER' },
            { user_id: provider_id, role: 'MEMBER' },
          ],
        },
      },
    });

    const complaint = await (prisma as any).providerComplaint.create({
      data: {
        user_id: userId,
        provider_id,
        service_id: service_id || null,
        conversation_id: conversation.conversation_id,
        subject,
        description,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
      },
      include: {
        user: { select: { full_name: true } },
        provider: { select: { full_name: true } },
        service: { select: { title: true } },
      },
    });

    getIO()?.to(`user_${provider_id}`).emit('complaint:new', complaint);

    await (prisma as any).notification.create({
      data: {
        user_id: provider_id,
        type: 'IN_APP',
        title: 'New Complaint Received',
        message: `A new complaint has been filed by ${complaint.user.full_name}: "${subject}"`,
      }
    });

    sendSuccess(res, complaint, 'Complaint filed', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// List complaints (for a provider or user)
router.get('/complaints', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const role = (req as any).user?.role;
    const isProvider = ['SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER', 'OFFICER', 'ADMIN'].includes(role);

    const where: any = isProvider ? { provider_id: userId } : { user_id: userId };

    const complaints = await (prisma as any).providerComplaint.findMany({
      where,
      include: {
        user: { select: { full_name: true, avatar_url: true } },
        provider: { select: { full_name: true, avatar_url: true } },
        service: { select: { title: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    sendSuccess(res, complaints);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Respond to a complaint
router.put('/complaints/:id/respond', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const complaintId = parseInt(req.params.id);
    const { response, status } = req.body;

    const complaint = await (prisma as any).providerComplaint.update({
      where: { complaint_id: complaintId },
      data: {
        response,
        status: status || 'IN_PROGRESS',
        responded_at: new Date(),
      },
      include: {
        user: { select: { full_name: true, avatar_url: true } },
        provider: { select: { full_name: true, avatar_url: true } },
        service: { select: { title: true } },
      }
    });

    getIO()?.to(`user_${complaint.user_id}`).emit('complaint:update', complaint);
    getIO()?.to(`user_${complaint.provider_id}`).emit('complaint:update', complaint);

    await (prisma as any).notification.create({
      data: {
        user_id: complaint.user_id,
        type: 'IN_APP',
        title: 'Complaint Update',
        message: `The provider has responded to your complaint: "${complaint.subject}"`,
      }
    });

    sendSuccess(res, complaint, 'Complaint updated');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Resolve a complaint
router.put('/complaints/:id/resolve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { rating, feedback } = req.body;

    const complaint = await (prisma as any).providerComplaint.update({
      where: { complaint_id: complaintId },
      data: {
        status: 'RESOLVED',
        resolved_at: new Date(),
        rating: rating || null,
        feedback: feedback || null,
      },
      include: {
        user: { select: { full_name: true, avatar_url: true } },
        provider: { select: { full_name: true, avatar_url: true } },
        service: { select: { title: true } },
      }
    });

    getIO()?.to(`user_${complaint.provider_id}`).emit('complaint:update', complaint);
    getIO()?.to(`user_${complaint.user_id}`).emit('complaint:update', complaint);

    await (prisma as any).notification.create({
      data: {
        user_id: complaint.user_id,
        type: 'IN_APP',
        title: 'Complaint Resolved',
        message: `Your complaint has been marked as resolved: "${complaint.subject}"`,
      }
    });

    sendSuccess(res, complaint, 'Complaint resolved');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// ============================================
// SERVICE GROUPS (Provider services with channels)
// ============================================

// List service groups by provider type
router.get('/service-groups', authMiddleware, async (req: Request, res: Response) => {
  try {
    const groups = await (prisma as any).chatConversation.findMany({
      where: { type: 'CHANNEL', is_active: true },
      include: {
        provider: { select: { user_id: true, full_name: true, role: true } },
        service: { select: { title: true, description: true, category: { select: { name: true } } } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Group by provider role
    const grouped: Record<string, any[]> = {};
    for (const g of groups) {
      const providerType = g.provider?.role || 'OTHER';
      if (!grouped[providerType]) grouped[providerType] = [];
      grouped[providerType].push(g);
    }

    sendSuccess(res, { groups, grouped });
  } catch (err: any) { sendError(res, err.message, 500); }
});

export default router;
