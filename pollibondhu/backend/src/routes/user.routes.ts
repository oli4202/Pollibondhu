import { Router } from 'express';
import { getProfile, updateProfile, listUsers, toggleUserStatus, changeRole } from '../controllers/user.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Profile — any authenticated user can view/update own profile
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// User management — requires user.view permission
router.get('/', authMiddleware, requirePermission('user.view'), listUsers);
router.put('/:id/status', authMiddleware, requirePermission('user.update'), toggleUserStatus);
router.put('/:id/role', authMiddleware, requirePermission('user.update'), changeRole);

export default router;
