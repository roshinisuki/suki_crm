import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const expiredSubs = await prisma.subscription.findMany({
    where: { status: 'Expired' }
  });

  for (const sub of expiredSubs) {
    // Check if the customer has a newer active subscription
    const newerActive = await prisma.subscription.findFirst({
      where: {
        customerId: sub.customerId,
        status: 'Active',
        createdAt: {
          gt: sub.createdAt
        }
      }
    });

    if (newerActive) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'Renewed' as any }
      });
      console.log(`Updated sub ${sub.id} to Renewed`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
