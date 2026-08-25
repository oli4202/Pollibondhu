import { Router } from 'express';
import { listInstitutions, getInstitution, createInstitution, updateInstitution, listCourses, createCourse, enrollStudent } from '../controllers/education.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/institutions', listInstitutions);
router.get('/institutions/:id', getInstitution);

// Protected routes - Institution management
router.post('/institutions', authMiddleware, requirePermission('education.institution.create'), createInstitution);
router.put('/institutions/:id', authMiddleware, requirePermission('education.institution.update'), updateInstitution);

// Course management
router.get('/institutions/:institutionId/courses', listCourses);
router.post('/institutions/:institutionId/courses', authMiddleware, requirePermission('education.course.create'), createCourse);

// Student management
router.post('/courses/:courseId/enroll', authMiddleware, requirePermission('education.student.enroll'), enrollStudent);

export default router;
