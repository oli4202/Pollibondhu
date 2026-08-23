import { Router } from 'express';
import { getProfile, updateProfile, listUsers, toggleUserStatus, changeRole } from '../controllers/user.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/', authMiddleware, requireRole('ADMIN'), listUsers);
router.put('/:id/status', authMiddleware, requireRole('ADMIN'), toggleUserStatus);
router.put('/:id/role', authMiddleware, requireRole('ADMIN'), changeRole);

export default router;
