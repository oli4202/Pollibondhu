import { Router } from 'express';
import { createService, listServices, getService, updateService, deleteService, approveService } from '../controllers/service.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { serviceSchema } from '../validators';

const router = Router();

router.get('/', listServices);
router.get('/:id', getService);
router.post('/', authMiddleware, requireRole('USER', 'PROVIDER'), validate(serviceSchema), createService);
router.put('/:id', authMiddleware, requireRole('USER', 'PROVIDER', 'ADMIN'), updateService);
router.delete('/:id', authMiddleware, requireRole('USER', 'PROVIDER', 'ADMIN'), deleteService);
router.put('/:id/approve', authMiddleware, requireRole('ADMIN'), approveService);

export default router;
