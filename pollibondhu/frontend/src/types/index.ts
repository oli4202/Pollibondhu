import { Role, Permission, RBACAssignment } from './rbac';
export * from './rbac';

export interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: Role | 'USER' | 'PROVIDER' | 'ADMIN';
  phone?: string;
  district?: string;
  
  // New RBAC Fields
  permissions?: Permission[];
  assignments?: RBACAssignment[];
}
