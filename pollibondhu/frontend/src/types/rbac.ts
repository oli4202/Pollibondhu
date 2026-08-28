/** All system roles */
export enum Role {
  ADMIN = 'ADMIN',           // Full system administrator
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  GOV_SERVICE_PROVIDER = 'GOV_SERVICE_PROVIDER',
  NGO_ADMIN = 'NGO_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  TEACHER = 'TEACHER',
  CITIZEN = 'CITIZEN',
  // Legacy roles (backward compatibility)
  USER = 'USER',
  PROVIDER = 'PROVIDER',
}

/** Permission type: module.action */
export type Permission =
  // Users
  | 'user.view' | 'user.create' | 'user.update' | 'user.delete'
  // Roles
  | 'role.view' | 'role.create' | 'role.update' | 'role.delete'
  | 'permission.view' | 'permission.assign'
  // Departments
  | 'department.view' | 'department.create' | 'department.update' | 'department.manage_officers'
  // Services
  | 'service.view' | 'service.create' | 'service.update' | 'service.delete' | 'service.approve' | 'service.reject'
  // Applications
  | 'application.view' | 'application.create' | 'application.process' | 'application.approve' | 'application.reject'
  // Complaints
  | 'complaint.view' | 'complaint.create' | 'complaint.assign' | 'complaint.update' | 'complaint.resolve' | 'complaint.verify' | 'complaint.close'
  // Projects & Budget
  | 'project.view' | 'project.create' | 'project.update' | 'project.delete' | 'project.feedback'
  | 'budget.view' | 'budget.create' | 'budget.update' | 'budget.approve'
  // Dashboard
  | 'dashboard.super.view' | 'dashboard.admin.view' | 'dashboard.subadmin.view' | 'dashboard.officer.view' | 'dashboard.citizen.view'
  // Messaging
  | 'message.send' | 'message.receive' | 'message.group_create' | 'message.department_chat'
  // Agriculture
  | 'agriculture.view' | 'agriculture.create' | 'agriculture.update'
  // Education
  | 'education.view' | 'institution.view' | 'institution.create' | 'institution.manage' | 'course.view' | 'course.create' | 'course.manage' | 'student.view' | 'student.enroll'
  // NGOs
  | 'ngo.view' | 'ngo.create' | 'ngo.manage' | 'programme.view' | 'programme.create' | 'programme.enroll' | 'donation.manage'
  // Notifications
  | 'notification.broadcast'
  // Events & News
  | 'event.view' | 'event.create' | 'event.attend' | 'news.view' | 'news.create' | 'news.publish'
  // Waste
  | 'waste.view' | 'waste.report' | 'waste.manage' | 'waste.zone.manage'
  // Emergency
  | 'emergency.view' | 'emergency.manage' | 'emergency.contact.manage'
  // Audit & Settings
  | 'audit.view' | 'audit.export' | 'settings.view' | 'settings.update'
  // AI
  | 'ai.chat' | 'ai.access_user_data' | 'ai.access_budget_data' | 'ai.access_complaint_data';

/** Location assignment */
export interface LocationAssignment {
  district?: string;
  upazila?: string;
  union?: string;
  village?: string;
  department?: string;
  service?: string;
}

/** RBAC assignment */
export interface RBACAssignment {
  role: Role;
  permissions: Permission[];
  location?: LocationAssignment;
}
