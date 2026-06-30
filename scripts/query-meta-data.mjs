import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Last 5 Leads ===');
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      leadCode: true,
      name: true,
      email: true,
      phone: true,
      leadSource: true,
      status: true,
      sourceMeta: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(leads, null, 2));

  console.log('\n=== Last 5 CommunicationLog (Activities) ===');
  const logs = await prisma.communicationLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 5,
    select: {
      id: true,
      channel: true,
      direction: true,
      content: true,
      leadId: true,
      agenda: true, // WhatsApp message ID stored here
      sentAt: true,
    },
  });
  console.log(JSON.stringify(logs, null, 2));

  console.log('\n=== Last 5 WebhookLog ===');
  const webhookLogs = await prisma.webhookLog.findMany({
    orderBy: { receivedAt: 'desc' },
    take: 5,
  });
  console.log(JSON.stringify(webhookLogs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
