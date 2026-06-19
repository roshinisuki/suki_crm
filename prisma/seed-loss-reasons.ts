// One-off script: seed default LossReason rows for every existing company.
// Run with: npx tsx prisma/seed-loss-reasons.ts  (or: npx ts-node prisma/seed-loss-reasons.ts)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_REASONS = [
  "Price too high",
  "Lost to competitor",
  "Product fit gap",
  "Poor timing",
  "Decision delayed",
  "Budget constraints",
  "Went with incumbent",
  "Feature mismatch",
  "Lost contact / unresponsive",
  "Quality concerns",
];

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true } });
  console.log(`Seeding LossReasons for ${companies.length} company(ies)...`);

  let total = 0;
  for (const c of companies) {
    const existing = await prisma.lossReason.count({ where: { companyId: c.id } });
    if (existing > 0) {
      console.log(`  ${c.id}: already has ${existing} reasons, skipping`);
      continue;
    }
    await prisma.lossReason.createMany({
      data: DEFAULT_REASONS.map((name) => ({ name, companyId: c.id, isActive: true })),
    });
    total += DEFAULT_REASONS.length;
    console.log(`  ${c.id}: added ${DEFAULT_REASONS.length} reasons`);
  }

  console.log(`Done. Inserted ${total} LossReason rows.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
