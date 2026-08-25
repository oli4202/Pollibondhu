import { Role, Permission, RBACAssignment } from './rbac';
export * from './rbac';

export interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: Role | string;
  phone?: string;
  district?: string;
  division?: string;
  upazila?: string;
  avatar_url?: string;

  // RBAC fields from backend
  roles?: string[];           // All assigned role names
  permissions?: Permission[]; // All resolved permission strings
  department_ids?: number[];  // Assigned department IDs
  location_ids?: number[];    // Assigned location IDs

  // Legacy RBAC fields (backward compatibility)
  department_id?: number | null;
  assigned_area?: string | null;
  assignments?: RBACAssignment[];
}
