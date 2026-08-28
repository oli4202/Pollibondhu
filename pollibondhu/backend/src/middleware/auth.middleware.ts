import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { RBACContext } from '../types';
import { logger } from '../patterns/singleton/Logger';

// ============================================
// Extended Request with RBAC Context
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: RBACContext;
}

// ============================================
// Cache for RBAC contexts (5-minute TTL)
// ============================================

const rbacCache = new Map<string, { context: RBACContext; expiresAt: number }>();
const RBAC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedRBAC(userId: number): RBACContext | null {
  const cached = rbacCache.get(`rbac:${userId}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.context;
  }
  rbacCache.delete(`rbac:${userId}`);
  return null;
}

function setCachedRBAC(userId: number, context: RBACContext): void {
  rbacCache.set(`rbac:${userId}`, {
    context,
    expiresAt: Date.now() + RBAC_CACHE_TTL,
  });
}

export function invalidateRBACCache(userId: number): void {
  rbacCache.delete(`rbac:${userId}`);
}

// ============================================
// Load Full RBAC Context from Database
// ============================================

async function loadRBACContext(userId: number): Promise<RBACContext> {
  // Check cache first
  const cached = getCachedRBAC(userId);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      email: true,
      role: true, // Legacy role string
      department_id: true,
      assigned_area: true,
      user_roles: {
        select: {
          role: {
            select: {
              name: true,
              role_permissions: {
                select: {
                  permission: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
      user_departments: {
        select: { department_id: true },
      },
      user_locations: {
        select: { location_id: true },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Collect all role names from database
  const roles: string[] = user.user_roles.map((ur) => ur.role.name);

  // If no roles assigned via user_roles, use legacy role
  if (roles.length === 0 && user.role) {
    roles.push(user.role);
  }

  // Collect all unique permissions across all roles from database
  const permissionSet = new Set<string>();
  for (const userRole of user.user_roles) {
    for (const rp of userRole.role.role_permissions) {
      permissionSet.add(rp.permission.name);
    }
  }

  // Legacy fallback — only used when no database roles/permissions are assigned
  if (permissionSet.size === 0) {
    const LEGACY: Record<string, string[]> = {
      ADMIN: ['user.view','user.create','user.update','user.delete','role.view','role.create','role.update','role.delete','permission.view','permission.assign','dashboard.admin.view','service.view','service.create','service.update','service.delete','service.approve','complaint.view','complaint.create','complaint.assign','complaint.update','complaint.resolve','application.view','application.process','application.approve','application.reject','budget.view','budget.create','budget.update','budget.approve','project.view','project.create','project.update','project.delete','department.view','department.create','department.update','department.manage_officers','notification.broadcast','audit.view','audit.export','settings.view','settings.update','message.send','message.receive','message.group_create','agriculture.view','agriculture.create','agriculture.update','education.view','institution.create','institution.manage','ngo.view','ngo.create','ngo.manage','event.view','event.create','news.view','news.create','news.publish','waste.view','waste.manage','waste.zone.manage','emergency.view','emergency.manage','emergency.contact.manage'],
      SERVICE_PROVIDER: ['service.view','service.create','service.update','service.delete','application.view','application.process','application.approve','application.reject','complaint.view','complaint.update','complaint.assign','complaint.resolve','project.view','project.update','department.view','message.send','message.receive','message.department_chat','dashboard.citizen.view','dashboard.officer.view'],
      GOV_SERVICE_PROVIDER: ['service.view','service.create','service.update','service.delete','application.view','application.process','application.approve','application.reject','complaint.view','complaint.update','complaint.assign','complaint.resolve','project.view','project.update','department.view','message.send','message.receive','message.group_create','message.department_chat','dashboard.citizen.view','dashboard.officer.view','notification.broadcast','agriculture.view','agriculture.create','agriculture.update','education.view','event.view','event.create','news.view','waste.view','waste.manage','emergency.view','emergency.manage'],
      CITIZEN: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
      USER: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
      FARMER: ['complaint.create','complaint.view','complaint.verify','complaint.close','application.view','application.create','project.view','project.feedback','message.send','message.receive','dashboard.citizen.view','agriculture.view','education.view','ngo.view','programme.enroll','event.view','event.attend','news.view','emergency.view','waste.report','ai.chat'],
    };
    for (const r of roles) {
      for (const p of (LEGACY[r] || [])) permissionSet.add(p);
    }
  }

  const context: RBACContext = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    roles,
    permissions: Array.from(permissionSet),
    department_ids: user.user_departments.map((ud) => ud.department_id),
    location_ids: user.user_locations.map((ul) => ul.location_id),
    department_id: user.department_id,
    assigned_area: user.assigned_area,
  };

  // Cache the context
  setCachedRBAC(userId, context);

  return context;
}

// ============================================
// Auth Middleware — Verifies JWT & Loads RBAC Context
// ============================================

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);

    // Load full RBAC context from database
    const rbacContext = await loadRBACContext(payload.user_id);
    req.user = rbacContext;

    next();
  } catch (err: any) {
    if (err.message === 'User not found') {
      sendError(res, 'User account not found', 401);
    } else {
      sendError(res, 'Invalid or expired token', 401);
    }
  }
}

// ============================================
// Role-Based Middleware
// ============================================

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    // ADMIN bypasses all role checks
    if (req.user.roles.includes('ADMIN')) {
      next();
      return;
    }
    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      sendError(res, 'Forbidden: insufficient role permissions', 403);
      return;
    }
    next();
  };
}

// ============================================
// Permission-Based Middleware
// ============================================

/**
 * Check if user has ALL of the specified permissions.
 * ADMIN bypasses all permission checks.
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // ADMIN bypasses all permission checks
    if (req.user.roles.includes('ADMIN')) {
      next();
      return;
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
      logger.warn(
        `Permission denied: user ${req.user.user_id} (${req.user.roles.join(',')}) ` +
        `missing [${requiredPermissions.join(', ')}]`
      );
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }

    next();
  };
}

/**
 * Check if user has ANY of the specified permissions.
 * ADMIN bypasses all permission checks.
 */
export function requireAnyPermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // ADMIN bypasses all permission checks
    if (req.user.roles.includes('ADMIN')) {
      next();
      return;
    }

    const hasAny = permissions.some((perm) => req.user!.permissions.includes(perm));

    if (!hasAny) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }

    next();
  };
}

// ============================================
// Department Access Middleware
// ============================================

/**
 * Check if user has access to the specified department.
 * ADMIN bypasses. Others must have matching department.
 */
export function requireDepartmentAccess(departmentIdParam: string = 'departmentId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // ADMIN bypasses
    if (req.user.roles.includes('ADMIN')) {
      next();
      return;
    }

    const requestedDeptId = Number(
      req.params[departmentIdParam] ||
      req.body[departmentIdParam] ||
      req.query[departmentIdParam]
    );

    if (!requestedDeptId) {
      next();
      return;
    }

    const hasAccess =
      req.user.department_ids.includes(requestedDeptId) ||
      req.user.department_id === requestedDeptId;

    if (!hasAccess) {
      logger.warn(
        `Department access denied: user ${req.user.user_id} ` +
        `tried to access department ${requestedDeptId}`
      );
      sendError(res, 'Forbidden: department access denied', 403);
      return;
    }

    next();
  };
}

// ============================================
// Location Access Middleware
// ============================================

/**
 * Check if user has access to the specified location.
 * ADMIN bypasses. Others must have matching location assignment.
 */
export function requireLocationAccess(locationIdParam: string = 'locationId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.roles.includes('ADMIN')) {
      next();
      return;
    }

    const requestedLocationId = Number(
      req.params[locationIdParam] ||
      req.body[locationIdParam] ||
      req.query[locationIdParam]
    );

    if (!requestedLocationId) {
      next();
      return;
    }

    const hasAccess = req.user.location_ids.includes(requestedLocationId);

    if (!hasAccess) {
      sendError(res, 'Forbidden: location access denied', 403);
      return;
    }

    next();
  };
}

// ============================================
// Ownership Middleware
// ============================================

/**
 * Check if the authenticated user owns the resource.
 * ADMIN bypasses ownership checks.
 */
export function requireOwnership(userIdParam: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // ADMIN bypasses ownership
    if (req.user.roles.includes('ADMIN')) {
      next();
      return;
    }

    const resourceOwnerId = Number(
      req.params[userIdParam] ||
      req.body[userIdParam] ||
      req.query[userIdParam]
    );

    if (resourceOwnerId && resourceOwnerId !== req.user.user_id) {
      sendError(res, 'Forbidden: you can only access your own resources', 403);
      return;
    }

    next();
  };
}

// ============================================
// Legacy requireDepartment (kept for backward compatibility)
// ============================================

export function requireDepartment(departmentIdParam: string = 'departmentId') {
  return requireDepartmentAccess(departmentIdParam);
}
