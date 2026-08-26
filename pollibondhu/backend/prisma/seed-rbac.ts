import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ALL PERMISSIONS IN THE SYSTEM
// ============================================
const ALL_PERMISSIONS = [
  // Users
  { name: 'user.view', module: 'user', description: 'View user profiles' },
  { name: 'user.create', module: 'user', description: 'Create new users' },
  { name: 'user.update', module: 'user', description: 'Update user profiles' },
  { name: 'user.delete', module: 'user', description: 'Delete users' },

  // Roles & Permissions
  { name: 'role.view', module: 'role', description: 'View roles' },
  { name: 'role.create', module: 'role', description: 'Create roles' },
  { name: 'role.update', module: 'role', description: 'Update roles' },
  { name: 'role.delete', module: 'role', description: 'Delete roles' },
  { name: 'permission.view', module: 'permission', description: 'View permissions' },
  { name: 'permission.assign', module: 'permission', description: 'Assign permissions to roles' },

  // Departments
  { name: 'department.view', module: 'department', description: 'View departments' },
  { name: 'department.create', module: 'department', description: 'Create departments' },
  { name: 'department.update', module: 'department', description: 'Update departments' },
  { name: 'department.manage_officers', module: 'department', description: 'Manage department officers' },

  // Services
  { name: 'service.view', module: 'service', description: 'View services' },
  { name: 'service.create', module: 'service', description: 'Create services' },
  { name: 'service.update', module: 'service', description: 'Update services' },
  { name: 'service.delete', module: 'service', description: 'Delete services' },
  { name: 'service.approve', module: 'service', description: 'Approve services' },
  { name: 'service.reject', module: 'service', description: 'Reject services' },

  // Applications
  { name: 'application.view', module: 'application', description: 'View applications' },
  { name: 'application.create', module: 'application', description: 'Create applications' },
  { name: 'application.process', module: 'application', description: 'Process applications' },
  { name: 'application.approve', module: 'application', description: 'Approve applications' },
  { name: 'application.reject', module: 'application', description: 'Reject applications' },

  // Complaints
  { name: 'complaint.view', module: 'complaint', description: 'View complaints' },
  { name: 'complaint.create', module: 'complaint', description: 'Create complaints' },
  { name: 'complaint.assign', module: 'complaint', description: 'Assign complaints' },
  { name: 'complaint.update', module: 'complaint', description: 'Update complaints' },
  { name: 'complaint.resolve', module: 'complaint', description: 'Resolve complaints' },
  { name: 'complaint.verify', module: 'complaint', description: 'Verify complaints' },
  { name: 'complaint.close', module: 'complaint', description: 'Close complaints' },

  // Projects & Budget
  { name: 'project.view', module: 'project', description: 'View projects' },
  { name: 'project.create', module: 'project', description: 'Create projects' },
  { name: 'project.update', module: 'project', description: 'Update projects' },
  { name: 'project.delete', module: 'project', description: 'Delete projects' },
  { name: 'project.feedback', module: 'project', description: 'Give project feedback' },
  { name: 'budget.view', module: 'budget', description: 'View budgets' },
  { name: 'budget.create', module: 'budget', description: 'Create budgets' },
  { name: 'budget.update', module: 'budget', description: 'Update budgets' },
  { name: 'budget.approve', module: 'budget', description: 'Approve budgets' },

  // Dashboards
  { name: 'dashboard.admin.view', module: 'dashboard', description: 'View admin dashboard' },
  { name: 'dashboard.officer.view', module: 'dashboard', description: 'View officer dashboard' },
  { name: 'dashboard.citizen.view', module: 'dashboard', description: 'View citizen dashboard' },

  // Messaging
  { name: 'message.send', module: 'message', description: 'Send messages' },
  { name: 'message.receive', module: 'message', description: 'Receive messages' },
  { name: 'message.group_create', module: 'message', description: 'Create group chats' },
  { name: 'message.department_chat', module: 'message', description: 'Access department chat' },

  // Agriculture
  { name: 'agriculture.view', module: 'agriculture', description: 'View agriculture data' },
  { name: 'agriculture.create', module: 'agriculture', description: 'Create agriculture entries' },
  { name: 'agriculture.update', module: 'agriculture', description: 'Update agriculture entries' },

  // Education
  { name: 'education.view', module: 'education', description: 'View education data' },
  { name: 'institution.view', module: 'education', description: 'View institutions' },
  { name: 'institution.create', module: 'education', description: 'Create institutions' },
  { name: 'institution.manage', module: 'education', description: 'Manage institutions' },
  { name: 'course.view', module: 'education', description: 'View courses' },
  { name: 'course.create', module: 'education', description: 'Create courses' },
  { name: 'course.manage', module: 'education', description: 'Manage courses' },
  { name: 'student.view', module: 'education', description: 'View students' },
  { name: 'student.enroll', module: 'education', description: 'Enroll students' },

  // NGOs
  { name: 'ngo.view', module: 'ngo', description: 'View NGOs' },
  { name: 'ngo.create', module: 'ngo', description: 'Create NGOs' },
  { name: 'ngo.manage', module: 'ngo', description: 'Manage NGOs' },
  { name: 'programme.view', module: 'ngo', description: 'View programmes' },
  { name: 'programme.create', module: 'ngo', description: 'Create programmes' },
  { name: 'programme.enroll', module: 'ngo', description: 'Enroll in programmes' },
  { name: 'donation.manage', module: 'ngo', description: 'Manage donations' },

  // Notifications
  { name: 'notification.broadcast', module: 'notification', description: 'Broadcast notifications' },

  // Events & News
  { name: 'event.view', module: 'event', description: 'View events' },
  { name: 'event.create', module: 'event', description: 'Create events' },
  { name: 'event.attend', module: 'event', description: 'Attend events' },
  { name: 'news.view', module: 'news', description: 'View news' },
  { name: 'news.create', module: 'news', description: 'Create news' },
  { name: 'news.publish', module: 'news', description: 'Publish news' },

  // Waste
  { name: 'waste.view', module: 'waste', description: 'View waste data' },
  { name: 'waste.report', module: 'waste', description: 'Report waste issues' },
  { name: 'waste.manage', module: 'waste', description: 'Manage waste' },
  { name: 'waste.zone.manage', module: 'waste', description: 'Manage waste zones' },

  // Emergency
  { name: 'emergency.view', module: 'emergency', description: 'View emergency info' },
  { name: 'emergency.manage', module: 'emergency', description: 'Manage emergencies' },
  { name: 'emergency.contact.manage', module: 'emergency', description: 'Manage emergency contacts' },

  // Audit & Settings
  { name: 'audit.view', module: 'audit', description: 'View audit logs' },
  { name: 'audit.export', module: 'audit', description: 'Export audit logs' },
  { name: 'settings.view', module: 'settings', description: 'View settings' },
  { name: 'settings.update', module: 'settings', description: 'Update settings' },

  // AI
  { name: 'ai.chat', module: 'ai', description: 'Use AI chat' },
];

// ============================================
// ROLES AND THEIR PERMISSIONS
// ============================================
const ROLES: Record<string, { description: string; permissions: string[] }> = {
  ADMIN: {
    description: 'Full system administrator — manages all users, departments, services, and system settings',
    permissions: ALL_PERMISSIONS.map(p => p.name), // ALL permissions
  },
  OFFICER: {
    description: 'Government officer — manages complaints, applications, and department activities',
    permissions: [
      'user.view',
      'complaint.view', 'complaint.update', 'complaint.assign', 'complaint.resolve',
      'application.view', 'application.process', 'application.approve', 'application.reject',
      'dashboard.officer.view',
      'message.send', 'message.receive', 'message.department_chat',
      'service.view', 'project.view', 'project.update',
      'department.view',
      'agriculture.view', 'agriculture.create', 'agriculture.update',
      'education.view',
      'event.view', 'event.create',
      'news.view',
      'waste.view', 'waste.manage',
      'emergency.view', 'emergency.manage',
    ],
  },
  SERVICE_PROVIDER: {
    description: 'Service provider — creates and manages services for citizens',
    permissions: [
      'service.view', 'service.create', 'service.update', 'service.delete',
      'message.send', 'message.receive',
      'dashboard.citizen.view',
    ],
  },
  GOV_SERVICE_PROVIDER: {
    description: 'Government service provider — manages government services (NID, birth cert, etc.)',
    permissions: [
      'service.view', 'service.create', 'service.update', 'service.delete',
      'application.view', 'application.process', 'application.approve', 'application.reject',
      'message.send', 'message.receive', 'message.group_create',
      'dashboard.citizen.view',
      'notification.broadcast',
    ],
  },
  NGO_ADMIN: {
    description: 'NGO administrator — manages NGO programmes and activities',
    permissions: [
      'ngo.view', 'ngo.manage',
      'programme.view', 'programme.create', 'programme.enroll',
      'donation.manage',
      'message.send', 'message.receive', 'message.group_create',
      'dashboard.citizen.view',
      'event.view', 'event.create',
      'education.view', 'institution.create',
    ],
  },
  INSTITUTION_ADMIN: {
    description: 'Educational institution administrator — manages courses and students',
    permissions: [
      'institution.view', 'institution.manage',
      'course.view', 'course.create', 'course.manage',
      'student.view', 'student.enroll',
      'message.send', 'message.receive', 'message.group_create',
      'dashboard.citizen.view',
      'education.view',
    ],
  },
  TEACHER: {
    description: 'Teacher — manages courses and views students',
    permissions: [
      'course.view', 'course.manage',
      'student.view',
      'message.send', 'message.receive',
      'dashboard.citizen.view',
      'education.view',
    ],
  },
  CITIZEN: {
    description: 'Regular citizen — files complaints, applies for services, participates in community',
    permissions: [
      'complaint.create', 'complaint.view', 'complaint.verify', 'complaint.close',
      'application.view', 'application.create',
      'project.view', 'project.feedback',
      'message.send', 'message.receive',
      'dashboard.citizen.view',
      'agriculture.view',
      'education.view',
      'ngo.view', 'programme.enroll',
      'event.view', 'event.attend',
      'news.view',
      'emergency.view',
      'waste.report',
      'ai.chat',
    ],
  },
};

async function main() {
  console.log('🌱 Seeding RBAC system...');

  // 1. Create all permissions
  console.log('  📋 Creating permissions...');
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
  }
  console.log(`  ✅ ${ALL_PERMISSIONS.length} permissions created`);

  // 2. Create all roles
  console.log('  👤 Creating roles...');
  for (const [roleName, roleData] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleData.description, is_system: true },
      create: { name: roleName, description: roleData.description, is_system: true },
    });

    // 3. Assign permissions to role
    for (const permName of roleData.permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: role.role_id, permission_id: perm.permission_id } },
          update: {},
          create: { role_id: role.role_id, permission_id: perm.permission_id },
        });
      }
    }
    console.log(`  ✅ Role "${roleName}" created with ${roleData.permissions.length} permissions`);
  }

  console.log('🎉 RBAC seeding complete!');
  console.log('');
  console.log('Roles created:');
  for (const [name, data] of Object.entries(ROLES)) {
    console.log(`  - ${name}: ${data.description}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ RBAC seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
