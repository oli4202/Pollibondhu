import { Router, Request, Response } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { getIO } from '../utils/socket';

const router = Router();

// ============================================
// COMMUNITY POSTS (ForumPost model)
// ============================================

// List posts (public, with optional category filter)
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const tab = req.query.tab as string; // 'feed', 'trending', 'my-posts'

    const where: any = { status: 'APPROVED' };
    if (category && category !== 'feed') {
      // Map tab names to categories
      const cat = category;
      where.category = cat;
    }
    if (tab === 'my-posts') {
      // Handled below with auth
    }

    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        user: { select: { user_id: true, full_name: true, role: true, avatar_url: true } },
        replies: {
          orderBy: { created_at: 'asc' },
          include: { user: { select: { full_name: true, avatar_url: true } } },
        },
      },
      orderBy: tab === 'trending' ? { likes: 'desc' } : { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Parse tags from JSON string
    const parsed = posts.map((p: any) => ({
      post_id: p.post_id,
      title: p.title,
      content: p.content,
      category: p.category || 'Community',
      tags: JSON.parse(p.tags || '[]'),
      likes: p.likes,
      replies: p.replies.map((reply: any) => ({ reply_id: reply.reply_id, content: reply.content, created_at: reply.created_at, author: reply.user })),
      views: p.views,
      created_at: p.created_at,
      author: p.user ? { full_name: p.user.full_name, role: p.user.role, avatar_url: p.user.avatar_url } : null,
    }));

    sendSuccess(res, parsed);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// List my posts (auth required)
router.get('/posts/mine', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const posts = await prisma.forumPost.findMany({
      where: { user_id: userId },
      include: {
        user: { select: { user_id: true, full_name: true, role: true, avatar_url: true } },
        replies: {
          orderBy: { created_at: 'asc' },
          include: { user: { select: { full_name: true, avatar_url: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const parsed = posts.map((p: any) => ({
      post_id: p.post_id,
      title: p.title,
      content: p.content,
      category: p.category || 'Community',
      tags: JSON.parse(p.tags || '[]'),
      likes: p.likes,
      replies: p.replies.map((reply: any) => ({ reply_id: reply.reply_id, content: reply.content, created_at: reply.created_at, author: reply.user })),
      views: p.views,
      created_at: p.created_at,
      author: p.user ? { full_name: p.user.full_name, role: p.user.role, avatar_url: p.user.avatar_url } : null,
    }));

    sendSuccess(res, parsed);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Reply to a community post
router.post('/posts/:id/replies', authMiddleware, async (req: Request, res: Response) => {
  try {
    const postId = Number.parseInt(req.params.id, 10);
    const userId = (req as any).user?.user_id;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!Number.isInteger(postId)) {
      sendError(res, 'Invalid post id', 400);
      return;
    }
    if (!content) {
      sendError(res, 'Reply content is required', 400);
      return;
    }

    const post = await prisma.forumPost.findUnique({ where: { post_id: postId } });
    if (!post) {
      sendError(res, 'Post not found', 404);
      return;
    }

    const reply = await prisma.forumReply.create({
      data: { post_id: postId, user_id: userId, content },
      include: { user: { select: { full_name: true, avatar_url: true } } },
    });

    await prisma.userActivity.create({
      data: { user_id: userId, action: 'Replied to a community post', entity_type: 'FORUM_REPLY', entity_id: reply.reply_id },
    });

    sendSuccess(res, {
      reply_id: reply.reply_id,
      content: reply.content,
      created_at: reply.created_at,
      author: reply.user,
    }, 'Reply added', 201);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Create a post (auth required)
router.post('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { title, content, category, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      sendError(res, 'Title and content are required', 400);
      return;
    }

    const post = await prisma.forumPost.create({
      data: {
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        category: category || 'Community',
        tags: JSON.stringify(tags || []),
        status: 'APPROVED', // Auto-approve for now
      },
      include: {
        user: { select: { user_id: true, full_name: true, role: true, avatar_url: true } },
      },
    });

    await prisma.userActivity.create({
      data: { user_id: userId, action: `Published community post: ${post.title}`, entity_type: 'FORUM_POST', entity_id: post.post_id },
    });

    const parsed = {
      post_id: post.post_id,
      title: post.title,
      content: post.content,
      category: post.category || 'Community',
      tags: JSON.parse(post.tags || '[]'),
      likes: post.likes,
      replies: [],
      views: post.views,
      created_at: post.created_at,
      author: post.user ? { full_name: post.user.full_name, role: post.user.role, avatar_url: post.user.avatar_url } : null,
    };

    const io = getIO();

    // 1. Broadcast new post to all users in the community room (real-time feed update)
    if (io) {
      io.to('community').emit('community:post', parsed);
    }

    // 2. Create in-DB notifications + push live alerts to all other active users
    const authorName = post.user?.full_name || 'Someone';
    const shortTitle = post.title.length > 50 ? post.title.substring(0, 47) + '...' : post.title;
    const notifTitle = `📢 New post in ${post.category}`;
    const notifMsg = `${authorName} posted: "${shortTitle}"`;

    // Run notification creation in background to avoid delaying API response
    setImmediate(async () => {
      try {
        const activeUsers = await prisma.user.findMany({
          where: { is_active: true, user_id: { not: userId } },
          select: { user_id: true },
        });

        // Create notifications for each user (SQLite doesn't support skipDuplicates)
        for (const u of activeUsers) {
          try {
            await prisma.notification.create({
              data: {
                user_id: u.user_id,
                type: 'COMMUNITY_POST',
                title: notifTitle,
                message: notifMsg,
              },
            });
          } catch { /* ignore duplicate errors */ }
        }

        // Push live socket notification to every user's personal room
        if (io) {
          const notifPayload = {
            type: 'COMMUNITY_POST',
            title: notifTitle,
            message: notifMsg,
            created_at: new Date().toISOString(),
            post_id: post.post_id,
          };
          for (const u of activeUsers) {
            io.to(`user_${u.user_id}`).emit('notification', notifPayload);
          }
        }
      } catch (notifErr: any) {
        console.error('[Community] Failed to send notifications:', notifErr.message);
      }
    });

    sendSuccess(res, parsed, 'Post published', 201);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});


// Like a post
router.post('/posts/:id/like', authMiddleware, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.forumPost.update({
      where: { post_id: postId },
      data: { likes: { increment: 1 } },
    });
    await prisma.userActivity.create({
      data: { user_id: (req as any).user.user_id, action: 'Reacted to a community post', entity_type: 'FORUM_POST', entity_id: postId },
    });
    sendSuccess(res, { likes: post.likes });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Increment views
router.post('/posts/:id/view', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.forumPost.update({
      where: { post_id: postId },
      data: { views: { increment: 1 } },
    });
    sendSuccess(res, { views: post.views });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// Delete own post
router.delete('/posts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user?.user_id;
    const post = await prisma.forumPost.findUnique({ where: { post_id: postId } });
    if (!post) { sendError(res, 'Post not found', 404); return; }
    if (post.user_id !== userId) { sendError(res, 'Not authorized', 403); return; }
    await prisma.forumPost.delete({ where: { post_id: postId } });
    sendSuccess(res, null, 'Post deleted');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

export default router;
