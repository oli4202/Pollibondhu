import { Router } from 'express';
import { getProfile, updateProfile, listUsers, toggleUserStatus, changeRole } from '../controllers/user.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { sendSuccess, sendError } from '../utils/apiResponse';

const router = Router();

// Profile — any authenticated user can view/update own profile
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/activity', authMiddleware, async (req: any, res) => {
	try {
		const activities = await prisma.userActivity.findMany({
			where: { user_id: req.user.user_id },
			orderBy: { created_at: 'desc' },
			take: 10,
		});
		sendSuccess(res, activities);
	} catch (err: any) {
		sendError(res, err.message, 500);
	}
});

// User management — requires user.view permission
router.get('/', authMiddleware, requirePermission('user.view'), listUsers);
router.put('/:id/status', authMiddleware, requirePermission('user.update'), toggleUserStatus);
router.put('/:id/role', authMiddleware, requirePermission('user.update'), changeRole);

export default router;
