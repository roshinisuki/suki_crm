const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmails() {
  const email = "kanmanivenkatesan12@gmail.com";
  const email2 = "kanmanivenkatesan12@gmai";
  const email3 = "kanmanivenkatesan12@gmai.com";

  console.log("Checking exact emails:");
  const c1 = await prisma.customer.findMany({ where: { email: { contains: 'kanmani' } } });
  console.log("Customers with kanmani:", c1.map(c => ({id: c.id, email: c.email, name: c.name})));

  const u1 = await prisma.user.findMany({ where: { email: { contains: 'kanmani' } } });
  console.log("Users with kanmani:", u1.map(u => ({id: u.id, email: u.email, name: u.name})));
  
  await prisma.$disconnect();
}

checkEmails().catch(console.error);
