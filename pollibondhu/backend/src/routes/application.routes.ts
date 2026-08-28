import { Router } from 'express';
import {
  submitApplication,
  getApplication,
  getApplicationByTracking,
  listApplications,
  processApplication,
  uploadDocument,
  getTimeline,
  provideFeedback,
  resubmitApplication,
} from '../controllers/application.controller';
import { authMiddleware, requirePermission, requireAnyPermission } from '../middleware/auth.middleware';

const router = Router();

// Citizen: submit application
router.post('/', authMiddleware, requirePermission('application.create'), submitApplication);

// Authenticated: list applications (scoping in service layer)
router.get('/', authMiddleware, requirePermission('application.view'), listApplications);

// Get by tracking ID
router.get('/track/:trackingId', authMiddleware, requirePermission('application.view'), getApplicationByTracking);

// Get by ID
router.get('/:id', authMiddleware, requirePermission('application.view'), getApplication);

// Officer/admin: process application
router.put('/:id/process', authMiddleware, requireAnyPermission('application.process', 'application.approve', 'application.reject'), processApplication);

// Upload document
router.post('/:id/documents', authMiddleware, requirePermission('application.view'), uploadDocument);

// Get timeline
router.get('/:id/timeline', authMiddleware, requirePermission('application.view'), getTimeline);

// Citizen: provide feedback
router.post('/:id/feedback', authMiddleware, requirePermission('application.view'), provideFeedback);

// Citizen: resubmit application
router.post('/:id/resubmit', authMiddleware, requirePermission('application.view'), resubmitApplication);

export default router;
