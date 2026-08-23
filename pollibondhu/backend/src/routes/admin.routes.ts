import { Router } from 'express';
import { getDashboardStats, getWeeklyStats, adminListUsers, adminListServices, adminListComplaints } from '../controllers/admin.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authMiddleware, requireRole('ADMIN'), getDashboardStats);
router.get('/dashboard/weekly', authMiddleware, requireRole('ADMIN'), getWeeklyStats);
router.get('/users', authMiddleware, requireRole('ADMIN'), adminListUsers);
router.get('/services', authMiddleware, requireRole('ADMIN'), adminListServices);
router.get('/complaints', authMiddleware, requireRole('ADMIN'), adminListComplaints);

export default router;
