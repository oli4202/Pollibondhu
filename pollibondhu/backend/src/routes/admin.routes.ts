import { Router, Request, Response } from 'express';
import { getDashboardStats, getWeeklyStats, adminListUsers, adminListServices, adminListComplaints } from '../controllers/admin.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { appEventSubject } from '../patterns/observer/NotificationSubject';

const router = Router();

// Dashboard — requires dashboard permission
router.get('/dashboard', authMiddleware, requirePermission('dashboard.super.view', 'dashboard.admin.view', 'dashboard.subadmin.view'), getDashboardStats);
router.get('/dashboard/weekly', authMiddleware, requirePermission('dashboard.super.view', 'dashboard.admin.view', 'dashboard.subadmin.view'), getWeeklyStats);

// User management — requires user.view
router.get('/users', authMiddleware, requirePermission('user.view'), adminListUsers);

// Create user (admin)
router.post('/users', authMiddleware, requirePermission('user.create'), async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, role, district } = req.body;
    if (!email || !password || !full_name) { sendError(res, 'email, password, full_name are required', 400); return; }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { sendError(res, 'Email already exists', 409); return; }
    const bcrypt = require('../utils/bcrypt');
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: await bcrypt.hashPassword(password),
        full_name,
        phone,
        role: role || 'CITIZEN',
        district,
        is_active: true,
      },
    });
    const { password_hash, ...safeUser } = user as any;

    // Create notification for the admin
    const adminId = (req as any).user?.user_id;
    if (adminId) {
      await prisma.notification.create({
        data: { user_id: adminId, type: 'SYSTEM', title: 'User Created', message: `User "${full_name}" (${email}) has been created.` },
      });
    }

    await appEventSubject.notify({
      type: 'USER_CREATED',
      payload: { admin_id: adminId, entity_type: 'USER', entity_id: user.user_id, email, full_name },
      timestamp: new Date(),
    }, prisma);

    sendSuccess(res, safeUser, 'User created', 201);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Update user (admin)
router.put('/users/:id', authMiddleware, requirePermission('user.update'), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, phone, role, district, division, upazila, is_active } = req.body;
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: { full_name, phone, role, district, division, upazila, is_active },
    });
    const { password_hash, ...safeUser } = user as any;

    const adminId = (req as any).user?.user_id;
    if (adminId) {
      await prisma.notification.create({
        data: { user_id: adminId, type: 'SYSTEM', title: 'User Updated', message: `User #${userId} has been updated.` },
      });
    }

    sendSuccess(res, safeUser, 'User updated');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Deactivate user (admin)
router.put('/users/:id/deactivate', authMiddleware, requirePermission('user.update'), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: { is_active: false },
    });

    const adminId = (req as any).user?.user_id;
    if (adminId) {
      await prisma.notification.create({
        data: { user_id: adminId, type: 'SYSTEM', title: 'User Deactivated', message: `User "${user.full_name}" has been deactivated.` },
      });
    }
    await appEventSubject.notify({
      type: 'USER_DEACTIVATED',
      payload: { admin_id: adminId, entity_type: 'USER', entity_id: userId },
      timestamp: new Date(),
    }, prisma);

    sendSuccess(res, null, 'User deactivated');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Delete user (admin)
router.delete('/users/:id', authMiddleware, requirePermission('user.delete'), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    await prisma.user.delete({ where: { user_id: userId } });
    const adminId = (req as any).user?.user_id;
    if (adminId) {
      await prisma.notification.create({
        data: { user_id: adminId, type: 'SYSTEM', title: 'User Deleted', message: `User #${userId} has been permanently deleted.` },
      });
    }
    sendSuccess(res, null, 'User deleted');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Service management — requires service.view
router.get('/services', authMiddleware, requirePermission('service.view'), adminListServices);

// Approve service (admin)
router.put('/services/:id/approve', authMiddleware, requirePermission('service.approve'), async (req: Request, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id);
    const service = await prisma.service.update({
      where: { service_id: serviceId },
      data: { status: 'APPROVED' },
    });

    const adminId = (req as any).user?.user_id;
    // Notify provider
    if (service.provider_id) {
      await prisma.notification.create({
        data: { user_id: service.provider_id, type: 'IN_APP', title: 'Service Approved', message: `Your service "${service.title}" has been approved and is now live.` },
      });
    }
    if (adminId) {
      await prisma.notification.create({
        data: { user_id: adminId, type: 'SYSTEM', title: 'Service Approved', message: `Service "${service.title}" (#${serviceId}) has been approved.` },
      });
    }
    await appEventSubject.notify({
      type: 'SERVICE_APPROVED',
      payload: { admin_id: adminId, provider_id: service.provider_id, service_id: serviceId, service_title: service.title, entity_type: 'SERVICE' },
      timestamp: new Date(),
    }, prisma);

    sendSuccess(res, service, 'Service approved');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Reject service (admin)
router.put('/services/:id/reject', authMiddleware, requirePermission('service.reject'), async (req: Request, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id);
    const { reason } = req.body;
    const service = await prisma.service.update({
      where: { service_id: serviceId },
      data: { status: 'REJECTED' },
    });

    if (service.provider_id) {
      await prisma.notification.create({
        data: { user_id: service.provider_id, type: 'IN_APP', title: 'Service Rejected', message: `Your service "${service.title}" was rejected.${reason ? ` Reason: ${reason}` : ''}` },
      });
    }

    sendSuccess(res, service, 'Service rejected');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Delete service (admin)
router.delete('/services/:id', authMiddleware, requirePermission('service.delete'), async (req: Request, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id);
    await prisma.service.delete({ where: { service_id: serviceId } });

    const adminId = (req as any).user?.user_id;
    if (adminId) {
      await prisma.notification.create({
        data: { user_id: adminId, type: 'SYSTEM', title: 'Service Deleted', message: `Service #${serviceId} has been deleted.` },
      });
    }

    sendSuccess(res, null, 'Service deleted');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Complaint management — requires complaint.view
router.get('/complaints', authMiddleware, requirePermission('complaint.view'), adminListComplaints);

// Assign complaint (admin)
router.put('/complaints/:id/assign', authMiddleware, requirePermission('complaint.assign'), async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { officer_id } = req.body;
    const complaint = await prisma.complaint.update({
      where: { complaint_id: complaintId },
      data: { assigned_to: officer_id, status: 'REVIEWING' },
    });

    // Notify officer
    await prisma.notification.create({
      data: { user_id: officer_id, type: 'COMPLAINT', title: 'Complaint Assigned', message: `Complaint #${complaintId} "${complaint.subject}" has been assigned to you.` },
    });
    // Notify citizen
    await prisma.notification.create({
      data: { user_id: complaint.user_id, type: 'COMPLAINT', title: 'Complaint Update', message: `Your complaint "${complaint.subject}" is now being reviewed.` },
    });

    sendSuccess(res, complaint, 'Complaint assigned');
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Department management
router.get('/departments', authMiddleware, requirePermission('department.view'), async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({ include: { _count: { select: { users: true } } } });
    sendSuccess(res, departments);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Audit logs
router.get('/audit-logs', authMiddleware, requirePermission('audit.view'), async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: { admin: { select: { full_name: true } } },
    });
    sendSuccess(res, logs);
  } catch (err: any) { sendError(res, err.message, 500); }
});

// Endpoint registry (system view of all API routes)
router.get('/endpoints', authMiddleware, requirePermission('dashboard.super.view', 'dashboard.admin.view'), async (req: Request, res: Response) => {
  try {
    const endpoints = [
      { method: 'POST', path: '/api/auth/register', module: 'auth', description: 'Register new user', auth: false },
      { method: 'POST', path: '/api/auth/login', module: 'auth', description: 'Login user', auth: false },
      { method: 'POST', path: '/api/auth/forgot-password', module: 'auth', description: 'Forgot password', auth: false },
      { method: 'POST', path: '/api/auth/reset-password', module: 'auth', description: 'Reset password', auth: false },
      { method: 'GET', path: '/api/users/profile', module: 'user', description: 'Get user profile', auth: true },
      { method: 'PUT', path: '/api/users/profile', module: 'user', description: 'Update profile', auth: true },
      { method: 'GET', path: '/api/users', module: 'user', description: 'List users', auth: true, permission: 'user.view' },
      { method: 'PUT', path: '/api/users/:id/status', module: 'user', description: 'Toggle user status', auth: true, permission: 'user.update' },
      { method: 'PUT', path: '/api/users/:id/role', module: 'user', description: 'Change user role', auth: true, permission: 'user.update' },
      { method: 'GET', path: '/api/admin/dashboard', module: 'admin', description: 'Admin dashboard stats', auth: true, permission: 'dashboard.admin.view' },
      { method: 'GET', path: '/api/admin/users', module: 'admin', description: 'Admin list users', auth: true, permission: 'user.view' },
      { method: 'POST', path: '/api/admin/users', module: 'admin', description: 'Admin create user', auth: true, permission: 'user.create' },
      { method: 'PUT', path: '/api/admin/users/:id', module: 'admin', description: 'Admin update user', auth: true, permission: 'user.update' },
      { method: 'DELETE', path: '/api/admin/users/:id', module: 'admin', description: 'Admin delete user', auth: true, permission: 'user.delete' },
      { method: 'PUT', path: '/api/admin/users/:id/deactivate', module: 'admin', description: 'Deactivate user', auth: true, permission: 'user.update' },
      { method: 'GET', path: '/api/admin/services', module: 'admin', description: 'Admin list services', auth: true, permission: 'service.view' },
      { method: 'PUT', path: '/api/admin/services/:id/approve', module: 'admin', description: 'Approve service', auth: true, permission: 'service.approve' },
      { method: 'PUT', path: '/api/admin/services/:id/reject', module: 'admin', description: 'Reject service', auth: true, permission: 'service.reject' },
      { method: 'DELETE', path: '/api/admin/services/:id', module: 'admin', description: 'Delete service', auth: true, permission: 'service.delete' },
      { method: 'GET', path: '/api/admin/complaints', module: 'admin', description: 'Admin list complaints', auth: true, permission: 'complaint.view' },
      { method: 'PUT', path: '/api/admin/complaints/:id/assign', module: 'admin', description: 'Assign complaint', auth: true, permission: 'complaint.assign' },
      { method: 'GET', path: '/api/admin/departments', module: 'admin', description: 'List departments', auth: true, permission: 'department.view' },
      { method: 'GET', path: '/api/admin/audit-logs', module: 'admin', description: 'Audit logs', auth: true, permission: 'audit.view' },
      { method: 'GET', path: '/api/admin/endpoints', module: 'admin', description: 'API endpoint registry', auth: true, permission: 'dashboard.super.view' },
      { method: 'GET', path: '/api/services', module: 'service', description: 'List services (public)', auth: false },
      { method: 'POST', path: '/api/services', module: 'service', description: 'Create service', auth: true, permission: 'service.create' },
      { method: 'PUT', path: '/api/services/:id', module: 'service', description: 'Update service', auth: true, permission: 'service.update' },
      { method: 'DELETE', path: '/api/services/:id', module: 'service', description: 'Delete service', auth: true, permission: 'service.delete' },
      { method: 'PUT', path: '/api/services/:id/approve', module: 'service', description: 'Approve service', auth: true, permission: 'service.approve' },
      { method: 'GET', path: '/api/complaints', module: 'complaint', description: 'List complaints', auth: true, permission: 'complaint.view' },
      { method: 'POST', path: '/api/complaints', module: 'complaint', description: 'Submit complaint', auth: true, permission: 'complaint.create' },
      { method: 'PUT', path: '/api/complaints/:id/status', module: 'complaint', description: 'Update complaint status', auth: true, permission: 'complaint.update' },
      { method: 'GET', path: '/api/applications', module: 'application', description: 'List applications', auth: true, permission: 'application.view' },
      { method: 'POST', path: '/api/applications', module: 'application', description: 'Submit application', auth: true, permission: 'application.create' },
      { method: 'GET', path: '/api/agriculture/live-prices', module: 'agriculture', description: 'Live market prices', auth: false },
      { method: 'GET', path: '/api/agriculture/commodity/:name', module: 'agriculture', description: 'Commodity detail', auth: false },
      { method: 'GET', path: '/api/notifications', module: 'notification', description: 'List notifications', auth: true },
      { method: 'GET', path: '/api/notifications/unread-count', module: 'notification', description: 'Unread count', auth: true },
      { method: 'GET', path: '/api/notifications/stream', module: 'notification', description: 'SSE live notifications', auth: true },
      { method: 'POST', path: '/api/notifications', module: 'notification', description: 'Create notification', auth: true },
      { method: 'PUT', path: '/api/notifications/:id/read', module: 'notification', description: 'Mark as read', auth: true },
      { method: 'PUT', path: '/api/notifications/read-all', module: 'notification', description: 'Mark all read', auth: true },
      { method: 'GET', path: '/api/ai/chat', module: 'ai', description: 'AI chat', auth: true, permission: 'ai.chat' },
      { method: 'GET', path: '/api/listings', module: 'listing', description: 'List village market items', auth: false },
      { method: 'POST', path: '/api/listings', module: 'listing', description: 'Create listing', auth: true },
      { method: 'GET', path: '/api/price-alerts', module: 'priceAlert', description: 'Price alerts', auth: true },
      { method: 'GET', path: '/api/education', module: 'education', description: 'Education data', auth: false },
      { method: 'GET', path: '/api/ngos', module: 'ngo', description: 'NGO data', auth: false },
    ];
    sendSuccess(res, { endpoints, total: endpoints.length });
  } catch (err: any) { sendError(res, err.message, 500); }
});

export default router;
