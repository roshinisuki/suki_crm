import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'RESET_LINK_SENT'
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 5
  });
  console.log("Recent Audit Logs:", logs);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
