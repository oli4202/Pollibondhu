import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  user?: { user_id: number; email: string; role: string; department_id?: number | null; assigned_area?: string | null };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    sendError(res, 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }
    next();
  };
}

export function requireDepartment(departmentIdParam: string = 'departmentId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }
    
    const requestedDeptId = Number(req.params[departmentIdParam] || req.body[departmentIdParam] || req.query[departmentIdParam]);
    if (req.user.department_id !== requestedDeptId && req.user.role !== 'SUB_ADMIN') {
      sendError(res, 'Forbidden: Department mismatch', 403);
      return;
    }
    
    next();
  };
}
