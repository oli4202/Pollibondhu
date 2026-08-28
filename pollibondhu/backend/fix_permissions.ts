import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing CITIZEN permissions in DB...');
  
  // Find CITIZEN role
  const role = await prisma.role.findUnique({ where: { name: 'CITIZEN' } });
  if (!role) {
    console.log('CITIZEN role not found!');
    return;
  }

  const requiredPermissions = [
    'service.view',
    'complaint.create', 'complaint.view', 'complaint.verify', 'complaint.close',
    'application.view', 'application.create', 'project.view', 'project.feedback',
    'message.send', 'message.receive', 'dashboard.citizen.view',
    'agriculture.view', 'education.view', 'ngo.view', 'programme.enroll',
    'event.view', 'event.attend', 'news.view', 'emergency.view',
    'waste.report', 'ai.chat',
  ];

  for (const permName of requiredPermissions) {
    const perm = await prisma.permission.findUnique({ where: { name: permName } });
    if (!perm) {
      console.log(`Permission ${permName} not found in DB!`);
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: { role_id: role.role_id, permission_id: perm.permission_id }
      },
      update: {},
      create: { role_id: role.role_id, permission_id: perm.permission_id }
    });
  }

  console.log('Successfully synced all permissions for CITIZEN role.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
