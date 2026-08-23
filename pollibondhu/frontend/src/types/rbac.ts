export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUB_ADMIN = 'SUB_ADMIN',
  OFFICER = 'OFFICER',
  CITIZEN = 'CITIZEN'
}

export type Permission = 
  // Users
  | 'user.view' | 'user.create' | 'user.update' | 'user.delete'
  // Complaints
  | 'complaint.view' | 'complaint.create' | 'complaint.assign' | 'complaint.update' | 'complaint.resolve'
  // Applications
  | 'application.view' | 'application.approve' | 'application.reject' | 'application.request_document'
  // Budget
  | 'budget.view' | 'budget.create' | 'budget.update' | 'budget.approve'
  // Dashboards
  | 'dashboard.admin.view'
  | 'dashboard.super.view'
  | 'dashboard.subadmin.view'
  // Messaging
  | 'message.send' | 'message.receive' | 'message.group_create';

export interface LocationAssignment {
  district?: string;
  upazila?: string;
  union?: string;
  village?: string;
  department?: string; // e.g., 'Agriculture', 'Health', 'Education'
  service?: string; // e.g., 'Horticulture', 'Clinic A'
}

export interface RBACAssignment {
  role: Role;
  permissions: Permission[];
  location?: LocationAssignment;
}
