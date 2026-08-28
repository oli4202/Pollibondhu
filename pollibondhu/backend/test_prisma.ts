import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const p = await prisma.user.findMany({
      where: { role: 'GOV_SERVICE_PROVIDER' },
      take: 1,
      select: {
        _count: {
          select: {
            provider_complaints_rcvd: { where: { status: 'RESOLVED' } }
          }
        },
        services: {
          select: {
            _count: {
              select: {
                applications: { where: { status: 'APPROVED' } }
              }
            }
          }
        }
      }
    });
    console.log(JSON.stringify(p));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
