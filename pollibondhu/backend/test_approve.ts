import { PrismaClient } from '@prisma/client';
import { ApplicationService } from './src/services/application.service';

const prisma = new PrismaClient();
const s = new ApplicationService(prisma);

async function test() {
  try {
    let app = await prisma.application.findFirst({ where: { status: 'REVIEWING' } });
    if (!app) {
      console.log('No REVIEWING app found.');
      return;
    }
    console.log(`Processing ${app.application_id} to IN_PROGRESS...`);
    app = await s.processApplication(app.application_id, 'IN_PROGRESS', 4, 'Moving to progress', undefined);
    
    console.log(`Processing ${app.application_id} to APPROVED...`);
    await s.processApplication(app.application_id, 'APPROVED', 4, 'Approved!', undefined);
    console.log('Success! Approved.');
  } catch (e: any) {
    console.error('Error during update:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
