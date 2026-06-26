import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { stageName: "SalesOpportunity", displayName: "Qualified", displayOrder: 1, probabilityPercent: 20, isClosedStage: false },
  { stageName: "RequirementGathering", displayName: "Requirement Gathering", displayOrder: 2, probabilityPercent: 30, isClosedStage: false },
  { stageName: "MeetingScheduled", displayName: "Meeting Scheduled", displayOrder: 3, probabilityPercent: 40, isClosedStage: false },
  { stageName: "DemoConducted", displayName: "Demo Conducted", displayOrder: 4, probabilityPercent: 50, isClosedStage: false },
  { stageName: "ProposalSent", displayName: "Proposal Sent", displayOrder: 5, probabilityPercent: 60, isClosedStage: false },
  { stageName: "Negotiation", displayName: "Negotiation", displayOrder: 6, probabilityPercent: 75, isClosedStage: false },
  { stageName: "Won", displayName: "Won", displayOrder: 7, probabilityPercent: 100, isClosedStage: true },
  { stageName: "Lost", displayName: "Lost", displayOrder: 8, probabilityPercent: 0, isClosedStage: true },
];

async function main() {
  for (const stage of DEFAULT_STAGES) {
    await prisma.pipelineStageMaster.upsert({
      where: { stageName: stage.stageName },
      update: stage,
      create: stage,
    });
    console.log(`Seeded stage: ${stage.stageName}`);
  }
  console.log("Pipeline stages seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
