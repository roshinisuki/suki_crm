import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      userType: true,
      isActive: true,
    }
  });
  console.log("Users in DB:", users);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
