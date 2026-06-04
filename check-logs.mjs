import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      timestamp: 'desc'
    },
    take: 20
  });
  console.log("Recent Audit Logs:", logs);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
