import { Router } from 'express';
import { submitComplaint, listComplaints, updateComplaintStatus } from '../controllers/complaint.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { complaintSchema, updateStatusSchema } from '../validators';

const router = Router();

router.post('/', authMiddleware, validate(complaintSchema), submitComplaint);
router.get('/', authMiddleware, listComplaints);
router.put('/:id/status', authMiddleware, requireRole('ADMIN'), validate(updateStatusSchema), updateComplaintStatus);

export default router;
