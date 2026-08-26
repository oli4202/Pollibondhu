import { Router } from 'express';
import { submitComplaint, listComplaints, updateComplaintStatus } from '../controllers/complaint.controller';
import { authMiddleware, requirePermission, requireAnyPermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { complaintSchema, updateStatusSchema } from '../validators';

const router = Router();

// Citizens can submit complaints
router.post('/', authMiddleware, requirePermission('complaint.create'), validate(complaintSchema), submitComplaint);

// Authenticated users can view complaints (scoping happens in service layer)
router.get('/', authMiddleware, requirePermission('complaint.view'), listComplaints);

// Officers/admins can update complaint status
router.put('/:id/status', authMiddleware, requireAnyPermission('complaint.update', 'complaint.resolve'), validate(updateStatusSchema), updateComplaintStatus);

export default router;
