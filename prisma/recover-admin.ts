import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@sukisoftware.com";
  const password = "Password@123";

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`[!] User "${email}" not found in database.`);
    console.log("[i] Creating new SuperAdmin user...");

    const hash = bcrypt.hashSync(password, 10);
    const created = await prisma.user.create({
      data: {
        email,
        name: "SUKI Admin",
        role: "SuperAdmin",
        passwordHash: hash,
        isActive: true,
        isFirstLogin: false,
        userType: "internal",
      },
    });
    console.log(`[OK] Created SuperAdmin: ${created.email} (id: ${created.id})`);
    console.log(`[OK] Password set to: ${password}`);
    return;
  }

  console.log(`[OK] Found user: ${user.email}`);
  console.log(`     Role: ${user.role}`);
  console.log(`     Active: ${user.isActive}`);
  console.log(`     CompanyId: ${user.companyId || "none"}`);
  console.log(`     Locked: ${user.lockedUntil ? user.lockedUntil : "no"}`);

  const hash = bcrypt.hashSync(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      isActive: true,
      isFirstLogin: false,
      lockedUntil: null,
      loginAttempts: 0,
    },
  });

  console.log(`\n[OK] Password reset to: ${password}`);
  console.log("[OK] Account unlocked and activated.");
}

main()
  .catch((e) => { console.error("[ERROR]", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
