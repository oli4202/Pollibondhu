import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const adminService = new AdminService(prisma);

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function getSubAdminDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const adminId = req.user?.user_id;
    if (!adminId) throw new Error('User not found');
    const stats = await adminService.getSubAdminDashboardStats(adminId);
    sendSuccess(res, stats);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function getOfficerDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const officerId = req.user?.user_id;
    if (!officerId) throw new Error('User not found');
    const stats = await adminService.getOfficerDashboardStats(officerId);
    sendSuccess(res, stats);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function getWeeklyStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = await adminService.getWeeklyStats();
    sendSuccess(res, stats);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function adminListUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const result = await adminService.listUsers({ page, limit, role, search });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function adminListServices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const result = await adminService.listServices({ page, limit, status, search });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function adminListComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const result = await adminService.listComplaints({ page, limit, status });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
