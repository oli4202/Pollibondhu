import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

const userService = new UserService(prisma);

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const profile = await userService.getProfile(req.user!.user_id);
    sendSuccess(res, profile);
  } catch (err: any) {
    sendError(res, err.message, 404);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const updated = await userService.updateProfile(req.user!.user_id, req.body);
    sendSuccess(res, updated, 'Profile updated');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const result = await userService.listUsers({ page, limit, role, search });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user_id = parseInt(req.params.id);
    const { is_active } = req.body;
    const result = await userService.toggleUserStatus(user_id, is_active);
    sendSuccess(res, result, 'User status updated');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function changeRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user_id = parseInt(req.params.id);
    const { role } = req.body;
    const result = await userService.changeRole(user_id, role);
    sendSuccess(res, result, 'User role updated');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
