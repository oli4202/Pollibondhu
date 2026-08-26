import { Router } from 'express';
import { createService, listServices, listMyServices, getService, updateService, deleteService, approveService } from '../controllers/service.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { serviceSchema } from '../validators';

const router = Router();

// Public endpoints
router.get('/', listServices);
router.get('/mine', authMiddleware, requirePermission('service.view'), listMyServices);
router.get('/:id', getService);

// Authenticated endpoints with permission checks
router.post('/', authMiddleware, requirePermission('service.create'), validate(serviceSchema), createService);
router.put('/:id', authMiddleware, requirePermission('service.update'), updateService);
router.delete('/:id', authMiddleware, requirePermission('service.delete'), deleteService);
router.put('/:id/approve', authMiddleware, requirePermission('service.approve'), approveService);

export default router;
