// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ============================================
// JWT & Auth Types
// ============================================

export interface TokenPayload {
  user_id: number;
  email: string;
  role: string; // Legacy role string for backward compatibility
}

// ============================================
// RBAC Types
// ============================================

/** All system roles */
export type SystemRole =
  | 'SUPER_ADMIN'
  | 'SUB_ADMIN'
  | 'OFFICER'
  | 'SERVICE_PROVIDER'
  | 'NGO_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'TEACHER'
  | 'CITIZEN';

/** Permission modules */
export type PermissionModule =
  | 'user' | 'role' | 'permission' | 'department' | 'location'
  | 'service' | 'application' | 'complaint' | 'project' | 'budget'
  | 'agriculture' | 'education' | 'ngo' | 'messaging' | 'notification'
  | 'event' | 'news' | 'waste' | 'emergency' | 'audit' | 'settings'
  | 'dashboard' | 'ai';

/** Permission actions */
export type PermissionAction =
  | 'view' | 'create' | 'update' | 'delete' | 'assign'
  | 'approve' | 'reject' | 'resolve' | 'manage' | 'broadcast'
  | 'process' | 'verify' | 'close' | 'feedback' | 'export'
  | 'enroll' | 'attend' | 'publish' | 'report' | 'chat'
  | 'access_user_data' | 'access_budget_data' | 'access_complaint_data';

/** Full permission string: module.action */
export type Permission = `${PermissionModule}.${PermissionAction}`;

/** Location assignment for a user */
export interface LocationAssignment {
  district?: string;
  upazila?: string;
  union?: string;
  village?: string;
  department?: string;
  service?: string;
}

/** RBAC assignment for a user */
export interface RBACAssignment {
  role: SystemRole;
  permissions: Permission[];
  location?: LocationAssignment;
}

/** Full RBAC context attached to authenticated request */
export interface RBACContext {
  user_id: number;
  email: string;
  role: string;                    // Legacy primary role
  roles: string[];                 // All assigned role names
  permissions: string[];           // All resolved permission strings
  department_ids: number[];        // Assigned department IDs
  location_ids: number[];          // Assigned location IDs
  department_id?: number | null;   // Legacy primary department
  assigned_area?: string | null;   // Legacy assigned area
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  totalServices: number;
  pendingServices: number;
  totalPosts: number;
  pendingComplaints: number;
  recentActivities: any[];
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
