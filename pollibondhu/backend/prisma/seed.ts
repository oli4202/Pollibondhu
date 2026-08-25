import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

// ============================================
// Permission definitions
// ============================================
const PERMISSIONS = [
  // User management
  { name: 'user.view', module: 'user', description: 'View users' },
  { name: 'user.create', module: 'user', description: 'Create users' },
  { name: 'user.update', module: 'user', description: 'Update users' },
  { name: 'user.delete', module: 'user', description: 'Delete users' },
  // Role management
  { name: 'role.view', module: 'role', description: 'View roles' },
  { name: 'role.create', module: 'role', description: 'Create roles' },
  { name: 'role.update', module: 'role', description: 'Update roles' },
  { name: 'role.delete', module: 'role', description: 'Delete roles' },
  { name: 'permission.view', module: 'permission', description: 'View permissions' },
  { name: 'permission.assign', module: 'permission', description: 'Assign permissions' },
  // Department
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
  { name: 'complaint.verify', module: 'complaint', description: 'Verify complaint resolution' },
  { name: 'complaint.close', module: 'complaint', description: 'Close complaints' },
  // Projects & Budget
  { name: 'project.view', module: 'project', description: 'View projects' },
  { name: 'project.create', module: 'project', description: 'Create projects' },
  { name: 'project.update', module: 'project', description: 'Update projects' },
  { name: 'project.delete', module: 'project', description: 'Delete projects' },
  { name: 'project.feedback', module: 'project', description: 'Provide project feedback' },
  { name: 'budget.view', module: 'budget', description: 'View budgets' },
  { name: 'budget.create', module: 'budget', description: 'Create budgets' },
  { name: 'budget.update', module: 'budget', description: 'Update budgets' },
  { name: 'budget.approve', module: 'budget', description: 'Approve budgets' },
  // Dashboard
  { name: 'dashboard.super.view', module: 'dashboard', description: 'View super admin dashboard' },
  { name: 'dashboard.admin.view', module: 'dashboard', description: 'View admin dashboard' },
  { name: 'dashboard.subadmin.view', module: 'dashboard', description: 'View sub-admin dashboard' },
  { name: 'dashboard.officer.view', module: 'dashboard', description: 'View officer dashboard' },
  { name: 'dashboard.citizen.view', module: 'dashboard', description: 'View citizen dashboard' },
  // Messaging
  { name: 'message.send', module: 'messaging', description: 'Send messages' },
  { name: 'message.receive', module: 'messaging', description: 'Receive messages' },
  { name: 'message.group_create', module: 'messaging', description: 'Create group chats' },
  { name: 'message.department_chat', module: 'messaging', description: 'Access department chat' },
  // Agriculture
  { name: 'agriculture.view', module: 'agriculture', description: 'View agriculture data' },
  { name: 'agriculture.create', module: 'agriculture', description: 'Create agriculture content' },
  { name: 'agriculture.update', module: 'agriculture', description: 'Update agriculture content' },
  // Education
  { name: 'education.view', module: 'education', description: 'View education data' },
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
  { name: 'emergency.view', module: 'emergency', description: 'View emergency contacts' },
  { name: 'emergency.manage', module: 'emergency', description: 'Manage emergency contacts' },
  { name: 'emergency.contact.manage', module: 'emergency', description: 'Manage emergency contacts' },
  // Audit & Settings
  { name: 'audit.view', module: 'audit', description: 'View audit logs' },
  { name: 'audit.export', module: 'audit', description: 'Export audit logs' },
  { name: 'settings.view', module: 'settings', description: 'View settings' },
  { name: 'settings.update', module: 'settings', description: 'Update settings' },
  // AI
  { name: 'ai.chat', module: 'ai', description: 'Use AI assistant' },
  { name: 'ai.access_user_data', module: 'ai', description: 'AI access to user data' },
  { name: 'ai.access_budget_data', module: 'ai', description: 'AI access to budget data' },
  { name: 'ai.access_complaint_data', module: 'ai', description: 'AI access to complaint data' },
];

// ============================================
// Role-permission mappings
// ============================================
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map(p => p.name), // All permissions
  SUB_ADMIN: [
    'user.view', 'complaint.view', 'complaint.assign', 'complaint.update', 'complaint.resolve',
    'application.view', 'application.process', 'application.approve', 'application.reject',
    'budget.view', 'budget.create', 'budget.update',
    'dashboard.subadmin.view',
    'message.send', 'message.receive', 'message.group_create', 'message.department_chat',
    'service.view', 'service.create', 'service.update', 'service.approve', 'service.reject',
    'project.view', 'project.create', 'project.update',
    'department.view', 'department.update', 'department.manage_officers',
    'notification.broadcast',
    'agriculture.view', 'agriculture.create', 'agriculture.update',
    'education.view', 'institution.manage',
    'ngo.view', 'event.view', 'event.create', 'news.view', 'news.create', 'news.publish',
    'waste.view', 'waste.manage', 'waste.zone.manage',
    'emergency.view', 'emergency.manage',
  ],
  OFFICER: [
    'user.view', 'complaint.view', 'complaint.update',
    'application.view', 'application.process', 'application.approve', 'application.reject',
    'dashboard.officer.view',
    'message.send', 'message.receive', 'message.department_chat',
    'service.view', 'project.view', 'project.update', 'department.view',
    'agriculture.view', 'agriculture.create', 'agriculture.update',
    'education.view', 'event.view', 'event.create', 'news.view',
    'waste.view', 'waste.manage', 'emergency.view', 'emergency.manage',
  ],
  SERVICE_PROVIDER: [
    'service.view', 'service.create', 'service.update', 'service.delete',
    'message.send', 'message.receive', 'dashboard.citizen.view',
  ],
  NGO_ADMIN: [
    'ngo.view', 'ngo.manage', 'programme.view', 'programme.create', 'programme.enroll',
    'donation.manage', 'message.send', 'message.receive', 'message.group_create',
    'dashboard.citizen.view', 'event.view', 'event.create', 'education.view', 'institution.create',
  ],
  INSTITUTION_ADMIN: [
    'institution.view', 'institution.manage', 'course.view', 'course.create', 'course.manage',
    'student.view', 'student.enroll', 'message.send', 'message.receive', 'message.group_create',
    'dashboard.citizen.view', 'education.view',
  ],
  TEACHER: [
    'course.view', 'course.manage', 'student.view',
    'message.send', 'message.receive', 'dashboard.citizen.view', 'education.view',
  ],
  CITIZEN: [
    'complaint.create', 'complaint.view', 'complaint.verify', 'complaint.close',
    'application.view', 'application.create', 'project.view', 'project.feedback',
    'message.send', 'message.receive', 'dashboard.citizen.view',
    'agriculture.view', 'education.view', 'ngo.view', 'programme.enroll',
    'event.view', 'event.attend', 'news.view', 'emergency.view',
    'waste.report', 'ai.chat',
  ],
};

async function main() {
  console.log('🌱 Seeding PolliBondhu database...');

  // ============================================
  // Seed Roles
  // ============================================
  console.log('  📋 Seeding roles...');
  const roleNames = ['SUPER_ADMIN', 'SUB_ADMIN', 'OFFICER', 'SERVICE_PROVIDER', 'NGO_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER', 'CITIZEN'];
  const roles: Record<string, number> = {};
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, is_system: true, description: `${name} role` },
    });
    roles[name] = role.role_id;
  }

  // ============================================
  // Seed Permissions
  // ============================================
  console.log('  🔑 Seeding permissions...');
  const permissionIds: Record<string, number> = {};
  for (const perm of PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: { name: perm.name, module: perm.module, description: perm.description },
    });
    permissionIds[perm.name] = p.permission_id;
  }

  // ============================================
  // Seed Role-Permission mappings
  // ============================================
  console.log('  🔗 Seeding role-permission mappings...');
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permName of permNames) {
      if (permissionIds[permName]) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: roles[roleName], permission_id: permissionIds[permName] } },
          update: {},
          create: { role_id: roles[roleName], permission_id: permissionIds[permName] },
        });
      }
    }
  }

  // ============================================
  // Seed Departments
  // ============================================
  console.log('  🏛️ Seeding departments...');
  const deptNames = ['Agriculture', 'Health', 'Education', 'Infrastructure', 'Social Welfare'];
  const departments: Record<string, number> = {};
  for (const name of deptNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} department` },
    });
    departments[name] = dept.department_id;
  }

  // ============================================
  // Seed Users
  // ============================================
  console.log('  👤 Seeding users...');

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@pollibondhu.test' },
    update: {},
    create: {
      email: 'superadmin@pollibondhu.test',
      password_hash: await hashPassword('admin123'),
      full_name: 'Super Administrator',
      phone: '01700000000',
      role: 'SUPER_ADMIN',
      district: 'Dhaka',
      division: 'Dhaka',
      is_active: true,
    },
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: superAdmin.user_id, role_id: roles['SUPER_ADMIN'] } },
    update: {},
    create: { user_id: superAdmin.user_id, role_id: roles['SUPER_ADMIN'] },
  });

  // Admin (Sub-Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pollibondhu.test' },
    update: {},
    create: {
      email: 'admin@pollibondhu.test',
      password_hash: await hashPassword('admin123'),
      full_name: 'System Administrator',
      phone: '01710000000',
      nid: '1234567890',
      role: 'SUB_ADMIN',
      district: 'Dhaka',
      division: 'Dhaka',
      is_active: true,
    },
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: admin.user_id, role_id: roles['SUB_ADMIN'] } },
    update: {},
    create: { user_id: admin.user_id, role_id: roles['SUB_ADMIN'] },
  });
  // Assign admin to Agriculture department
  await prisma.userDepartment.upsert({
    where: { user_id_department_id: { user_id: admin.user_id, department_id: departments['Agriculture'] } },
    update: {},
    create: { user_id: admin.user_id, department_id: departments['Agriculture'] },
  });

  // Officer
  const officer = await prisma.user.upsert({
    where: { email: 'officer@pollibondhu.test' },
    update: {},
    create: {
      email: 'officer@pollibondhu.test',
      password_hash: await hashPassword('officer123'),
      full_name: 'Agriculture Officer Karim',
      phone: '01710000001',
      role: 'OFFICER',
      district: 'Rajshahi',
      division: 'Rajshahi',
      department_id: departments['Agriculture'],
      is_active: true,
    },
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: officer.user_id, role_id: roles['OFFICER'] } },
    update: {},
    create: { user_id: officer.user_id, role_id: roles['OFFICER'] },
  });
  await prisma.userDepartment.upsert({
    where: { user_id_department_id: { user_id: officer.user_id, department_id: departments['Agriculture'] } },
    update: {},
    create: { user_id: officer.user_id, department_id: departments['Agriculture'] },
  });

  // Provider
  const provider = await prisma.user.upsert({
    where: { email: 'provider@pollibondhu.test' },
    update: {},
    create: {
      email: 'provider@pollibondhu.test',
      password_hash: await hashPassword('provider123'),
      full_name: 'Karim Agro Services',
      phone: '01711111111',
      nid: '9876543210',
      role: 'SERVICE_PROVIDER',
      district: 'Rajshahi',
      division: 'Rajshahi',
      is_active: true,
    },
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: provider.user_id, role_id: roles['SERVICE_PROVIDER'] } },
    update: {},
    create: { user_id: provider.user_id, role_id: roles['SERVICE_PROVIDER'] },
  });

  // Citizens
  const citizens = await Promise.all([
    prisma.user.upsert({ where: { email: 'rahim@pollibondhu.test' }, update: {}, create: { email: 'rahim@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Rahim Uddin', phone: '01722222222', role: 'CITIZEN', district: 'Dinajpur', division: 'Rangpur', is_active: true } }),
    prisma.user.upsert({ where: { email: 'sultana@pollibondhu.test' }, update: {}, create: { email: 'sultana@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Sultana Begum', phone: '01733333333', role: 'CITIZEN', district: 'Jhalokati', division: 'Barisal', is_active: true } }),
    prisma.user.upsert({ where: { email: 'abdur@pollibondhu.test' }, update: {}, create: { email: 'abdur@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Abdur Rahman', phone: '01744444444', role: 'CITIZEN', district: "Cox's Bazar", division: 'Chittagong', is_active: true } }),
    prisma.user.upsert({ where: { email: 'fatema@pollibondhu.test' }, update: {}, create: { email: 'fatema@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Fatema Khatun', phone: '01755555555', role: 'CITIZEN', district: 'Khulna', division: 'Khulna', is_active: true } }),
    prisma.user.upsert({ where: { email: 'hasan@pollibondhu.test' }, update: {}, create: { email: 'hasan@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Hasan Ali', phone: '01766666666', role: 'CITIZEN', district: 'Sylhet', division: 'Sylhet', is_active: true } }),
  ]);
  // Assign CITIZEN role to all citizens
  for (const citizen of citizens) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: citizen.user_id, role_id: roles['CITIZEN'] } },
      update: {},
      create: { user_id: citizen.user_id, role_id: roles['CITIZEN'] },
    });
  }
  const users = citizens; // alias for backward compatibility with rest of seed

  // Categories
  const [agriCat, citizenCat, forumCat, healthCat] = await Promise.all([
    prisma.category.create({ data: { name: 'Agriculture', type: 'SERVICE', is_active: true } }),
    prisma.category.create({ data: { name: 'Citizen', type: 'SERVICE', is_active: true } }),
    prisma.category.create({ data: { name: 'General', type: 'FORUM', is_active: true } }),
    prisma.category.create({ data: { name: 'Health', type: 'SERVICE', is_active: true } }),
  ]);

  // Crops
  const crops = await Promise.all([
    prisma.crop.create({ data: { name: 'Boro Paddy', name_bn: 'বোরো ধান', season: 'Rabi', description: 'Ideal sowing time mid-November to December. Use BRRI dhan28 or BRRI dhan29.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Mustard', name_bn: 'সরিষা', season: 'Rabi', description: 'Apply 100kg urea per hectare at 20-25 days after sowing.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Potato', name_bn: 'আলু', season: 'Rabi', description: 'Late blight disease risk is high due to foggy weather. Apply Mancozeb.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Aman Paddy', name_bn: 'আমন ধান', season: 'Kharif', description: 'Transplant seedlings in July-August. Use BRRI dhan49 for flood-prone areas.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Wheat', name_bn: 'গম', season: 'Rabi', description: 'Sow by mid-November. Use BARI Gom-28 for higher yield.', category_id: agriCat.category_id } }),
  ]);

  // Services
  const services = await Promise.all([
    prisma.service.create({ data: { provider_id: provider.user_id, category_id: agriCat.category_id, title: 'Power Tiller Rental', description: 'Rent power tiller for your field. 500 BDT per hour.', price: 500.00, district: 'Rajshahi', status: 'APPROVED', is_available: true } }),
    prisma.service.create({ data: { provider_id: provider.user_id, category_id: agriCat.category_id, title: 'Seed Supply - BRRI Dhan28', description: 'High quality Boro paddy seeds available.', price: 85.00, district: 'Rajshahi', status: 'APPROVED', is_available: true } }),
    prisma.service.create({ data: { provider_id: provider.user_id, category_id: citizenCat.category_id, title: 'Land Survey Service', description: 'Professional land measurement and khatian correction.', price: 1500.00, district: 'Rajshahi', status: 'PENDING', is_available: true } }),
    prisma.service.create({ data: { provider_id: users[0].user_id, category_id: healthCat.category_id, title: 'Mobile Health Camp', description: 'Free health checkup camp in rural areas.', district: 'Dinajpur', status: 'APPROVED', is_available: true } }),
  ]);

  // Market Prices
  await Promise.all([
    prisma.marketPrice.create({ data: { crop_id: crops[0].crop_id, market_name: 'Dhaka Central Market', price: 2100.00, unit: '50kg', change_pct: 2.3 } }),
    prisma.marketPrice.create({ data: { crop_id: crops[2].crop_id, market_name: 'Dhaka Central Market', price: 28.00, unit: 'kg', change_pct: 5.2 } }),
    prisma.marketPrice.create({ data: { crop_id: crops[1].crop_id, market_name: 'Rajshahi Market', price: 82.00, unit: 'kg', change_pct: -1.1 } }),
    prisma.marketPrice.create({ data: { crop_id: crops[4].crop_id, market_name: 'Dhaka Central Market', price: 1850.00, unit: '50kg', change_pct: -0.8 } }),
  ]);

  // Forum Posts
  await Promise.all([
    prisma.forumPost.create({ data: { user_id: users[0].user_id, category_id: forumCat.category_id, title: 'Boro paddy blast disease — how to control it organically?', content: 'I am seeing brownish spots on my paddy leaves after the fog last week. What organic treatments can I use?', tags: JSON.stringify(['Paddy', 'Disease', 'Organic Farming']), status: 'APPROVED', likes: 24, views: 347 } }),
    prisma.forumPost.create({ data: { user_id: users[1].user_id, category_id: forumCat.category_id, title: 'Fertilizer subsidy distribution schedule — December 2024', content: 'Dear farmers, subsidy fertilizer will be distributed at your local UP complex from Dec 22-28.', tags: JSON.stringify(['Subsidy', 'Fertilizer', 'Official']), status: 'APPROVED', likes: 89, views: 892 } }),
    prisma.forumPost.create({ data: { user_id: users[2].user_id, category_id: forumCat.category_id, title: 'Water logging problem in Harinathpur village road', content: 'The road from Harinathpur bazaar to the school gets flooded every rain. Children cannot reach school safely.', tags: JSON.stringify(['Infrastructure', 'Flood', 'Community Issue']), status: 'APPROVED', likes: 43, views: 265 } }),
  ]);

  // Complaints
  await Promise.all([
    prisma.complaint.create({ data: { user_id: users[0].user_id, category: 'Infrastructure', subject: 'Road damage in Naichity', description: 'The main road to the bazaar is severely damaged.', status: 'PENDING', priority: 'HIGH' } }),
    prisma.complaint.create({ data: { user_id: users[1].user_id, category: 'Agriculture', subject: 'Fertilizer shortage', description: 'Local dealers are not getting enough urea supply.', status: 'REVIEWING', priority: 'MEDIUM' } }),
    prisma.complaint.create({ data: { user_id: users[2].user_id, category: 'Health', subject: 'Doctor absent at Union Health Center', description: 'The assigned doctor has been absent for 3 days.', status: 'RESOLVED', priority: 'HIGH', reviewed_by: admin.user_id, resolution_notes: 'Replacement doctor appointed.', resolved_at: new Date() } }),
  ]);

  // Expert
  const expert = await prisma.expert.create({
    data: { user_id: users[0].user_id, specialization: 'Rice Cultivation', bio: '20 years experience in Boro and Aman paddy cultivation.', rating: 4.8, is_verified: true },
  });

  // Weather
  await Promise.all([
    prisma.weather.create({ data: { district: 'Dhaka', temperature: 28, condition: 'Partly Cloudy', humidity: 78, rainfall: 12, uv_index: 'High', updated_by: admin.user_id } }),
    prisma.weather.create({ data: { district: 'Rajshahi', temperature: 26, condition: 'Sunny', humidity: 65, rainfall: 0, uv_index: 'Very High', updated_by: admin.user_id } }),
    prisma.weather.create({ data: { district: 'Dinajpur', temperature: 24, condition: 'Foggy', humidity: 85, rainfall: 5, uv_index: 'Low', updated_by: admin.user_id } }),
  ]);

  // Crop Advice
  await Promise.all([
    prisma.cropAdvice.create({ data: { expert_id: expert.expert_id, crop_id: crops[0].crop_id, title: 'Boro Paddy Sowing Guide', content: 'Sow seeds in seedbed by mid-November. Use 40kg seeds per hectare.' } }),
    prisma.cropAdvice.create({ data: { expert_id: expert.expert_id, crop_id: crops[2].crop_id, title: 'Potato Disease Alert', content: 'Apply Mancozeb or Ridomil at 7-day intervals. Remove infected plants immediately.' } }),
  ]);

  // Certificates
  await Promise.all([
    prisma.certificate.create({ data: { user_id: users[0].user_id, cert_type: 'TRAINING', status: 'APPROVED', approved_by: admin.user_id, approved_at: new Date() } }),
    prisma.certificate.create({ data: { user_id: users[1].user_id, cert_type: 'BIRTH', status: 'PENDING' } }),
  ]);

  // Polls
  const poll = await prisma.poll.create({
    data: { question: 'Best irrigation method for Boro paddy?', options: JSON.stringify(['Flood Irrigation', 'Drip Irrigation', 'Sprinkler', 'Alternate Wetting & Drying']), is_active: true, created_by: admin.user_id },
  });

  // Votes
  await prisma.vote.create({ data: { user_id: users[0].user_id, poll_id: poll.poll_id, choice: 'Alternate Wetting & Drying' } });
  await prisma.vote.create({ data: { user_id: users[1].user_id, poll_id: poll.poll_id, choice: 'Drip Irrigation' } });

  // Notifications
  await Promise.all([
    prisma.notification.create({ data: { user_id: users[0].user_id, type: 'IN_APP', title: 'Welcome to PolliBondhu', message: 'Your account has been created successfully.' } }),
    prisma.notification.create({ data: { user_id: provider.user_id, type: 'IN_APP', title: 'Service Approved', message: 'Your Power Tiller Rental service is now live.' } }),
  ]);

  // Audit Logs
  await Promise.all([
    prisma.auditLog.create({ data: { admin_id: admin.user_id, action: 'USER_CREATED', entity_type: 'USER', entity_id: users[0].user_id, details: JSON.stringify({ email: users[0].email }) } }),
    prisma.auditLog.create({ data: { admin_id: admin.user_id, action: 'SERVICE_APPROVED', entity_type: 'SERVICE', entity_id: services[0].service_id, details: JSON.stringify({ title: services[0].title }) } }),
  ]);

  console.log('✅ Seed completed successfully!');
  console.log('   --- RBAC ---');
  console.log(`   Roles: ${roleNames.join(', ')}`);
  console.log(`   Permissions: ${PERMISSIONS.length}`);
  console.log(`   Departments: ${deptNames.join(', ')}`);
  console.log('   --- Users ---');
  console.log(`   Super Admin: ${superAdmin.email} / admin123`);
  console.log(`   Admin: ${admin.email} / admin123`);
  console.log(`   Officer: ${officer.email} / officer123`);
  console.log(`   Provider: ${provider.email} / provider123`);
  console.log(`   Citizens: ${citizens.map(u => u.email + ' / user123').join(', ')}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
