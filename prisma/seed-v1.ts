/**
 * SUKI CRM — Seed Data Script V1
 * Core CRM: Companies, Users, Leads, Customers, Contacts, Tasks, Follow-ups, Activities, Deals
 *
 * Run: npx ts-node prisma/seed-v1.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = bcrypt.hashSync("Password@123", 10);

async function main() {
  console.log("🌱 Starting V1 seed...\n");

  // ─── Companies ───────────────────────────────────────────────────────────
  const apex = await prisma.company.upsert({
    where: { name: "Apex Industries" },
    update: {},
    create: { name: "Apex Industries", variant: 4, baseCurrency: "INR" },
  });

  const bharat = await prisma.company.upsert({
    where: { name: "Bharat Metal Works" },
    update: {},
    create: { name: "Bharat Metal Works", variant: 4, baseCurrency: "INR" },
  });

  console.log(`✅ Companies: ${apex.name}, ${bharat.name}`);

  // ─── Users ───────────────────────────────────────────────────────────────
  const users = [
    { email: "superadmin@sukisoft.com", name: "Super Admin", role: "SuperAdmin", companyId: null, department: "Management", isFirstLogin: false },
    { email: "admin@apexindustries.com", name: "Rajesh Kumar", role: "Admin", companyId: apex.id, department: "Management", isFirstLogin: false },
    { email: "manager@apexindustries.com", name: "Priya Sharma", role: "SalesManager", companyId: apex.id, department: "Sales", isFirstLogin: false },
    { email: "exec1@apexindustries.com", name: "Amit Patel", role: "SalesExecutive", companyId: apex.id, department: "Sales", isFirstLogin: false },
    { email: "exec2@apexindustries.com", name: "Sneha Reddy", role: "SalesExecutive", companyId: apex.id, department: "Sales", isFirstLogin: false },
    { email: "admin@bharatmetalworks.com", name: "Vikram Singh", role: "Admin", companyId: bharat.id, department: "Management", isFirstLogin: false },
    { email: "exec1@bharatmetalworks.com", name: "Deepak Gupta", role: "SalesExecutive", companyId: bharat.id, department: "Sales", isFirstLogin: false },
  ];

  const userMap: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: PASSWORD, phone: "+91-98765-00000" },
    });
    userMap[u.email] = user.id;
  }
  console.log(`✅ Users: ${users.length} created`);

  const adminApex = userMap["admin@apexindustries.com"];
  const mgrApex = userMap["manager@apexindustries.com"];
  const exec1 = userMap["exec1@apexindustries.com"];
  const exec2 = userMap["exec2@apexindustries.com"];

  // ─── Lead Sources ────────────────────────────────────────────────────────
  const sources = ["Website", "Referral", "Trade Show", "Cold Call", "Email Campaign", "WhatsApp"];
  for (const s of sources) {
    try {
      await prisma.leadSource.upsert({
        where: { name: s },
        update: {},
        create: { name: s, companyId: apex.id },
      });
    } catch (e) { console.log(`⚠️  LeadSource "${s}" skipped (unique constraint)`); }
  }
  console.log(`✅ Lead Sources: ${sources.length}`);

  // ─── Leads (12 incl. 1 duplicate pair) ───────────────────────────────────
  const leadsData = [
    { leadCode: "LEAD-0001", name: "TechNova Solutions", email: "contact@technova.com", phone: "+91-80-12345678", city: "Bangalore", status: "New", assignedUserId: exec1, leadSource: "Website", companyId: apex.id },
    { leadCode: "LEAD-0002", name: "GreenLeaf Energy", email: "info@greenleaf.in", phone: "+91-22-98765432", city: "Mumbai", status: "Contacted", assignedUserId: exec2, leadSource: "Referral", companyId: apex.id },
    { leadCode: "LEAD-0003", name: "BlueWave Logistics", email: "hello@bluewave.co.in", phone: "+91-44-55667788", city: "Chennai", status: "Qualified", assignedUserId: exec1, leadSource: "Trade Show", companyId: apex.id },
    { leadCode: "LEAD-0004", name: "Pinnacle Manufacturing", email: "sales@pinnacle.in", phone: "+91-40-11223344", city: "Hyderabad", status: "Contacted", assignedUserId: exec2, leadSource: "Cold Call", companyId: apex.id },
    { leadCode: "LEAD-0005", name: "Sterling Industries", email: "procurement@sterling.com", phone: "+91-11-99887766", city: "New Delhi", status: "Qualified", assignedUserId: exec1, leadSource: "Email Campaign", companyId: apex.id },
    { leadCode: "LEAD-0006", name: "Crystal Polymers", email: "info@crystalpoly.in", phone: "+91-79-44556677", city: "Ahmedabad", status: "New", assignedUserId: exec2, leadSource: "WhatsApp", companyId: apex.id },
    { leadCode: "LEAD-0007", name: "Vortex Engineering", email: "contact@vortexeng.com", phone: "+91-80-88776655", city: "Bangalore", status: "Disqualified", assignedUserId: exec1, leadSource: "Website", companyId: apex.id, notes: "Budget too low" },
    { leadCode: "LEAD-0008", name: "Apex Steel Works", email: "buy@apexsteel.in", phone: "+91-33-22334455", city: "Kolkata", status: "Qualified", assignedUserId: exec2, leadSource: "Referral", companyId: apex.id },
    // Duplicate pair — same lead, different leadCode (for dedup testing)
    { leadCode: "LEAD-0009", name: "Sunrise Plastics", email: "purchase@sunriseplastics.com", phone: "+91-265-77889900", city: "Vadodara", status: "New", assignedUserId: exec1, leadSource: "Website", companyId: apex.id },
    { leadCode: "LEAD-0010", name: "Sunrise Plastics", email: "purchase@sunriseplastics.com", phone: "+91-265-77889900", city: "Vadodara", status: "New", assignedUserId: exec2, leadSource: "Website", companyId: apex.id },
    // Company B leads
    { leadCode: "LEAD-0011", name: "Mahalaxmi Textiles", email: "info@mahalaxmi.tex", phone: "+91-251-66778899", city: "Solapur", status: "New", assignedUserId: userMap["exec1@bharatmetalworks.com"], leadSource: "Website", companyId: bharat.id },
    { leadCode: "LEAD-0012", name: "Shree Balaji Metals", email: "sales@balajimetals.in", phone: "+91-241-33445566", city: "Jalgaon", status: "Contacted", assignedUserId: userMap["exec1@bharatmetalworks.com"], leadSource: "Referral", companyId: bharat.id },
  ];

  for (const l of leadsData) {
    try {
      await prisma.lead.create({ data: l });
    } catch (e: any) {
      console.log(`⚠️  Lead "${l.leadCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Leads: ${leadsData.length} created`);

  // ─── Customers (9) ───────────────────────────────────────────────────────
  const customersData = [
    { customerCode: "CUST-0001", name: "TechNova Solutions", email: "purchase@technova.com", phone: "+91-80-12345678", city: "Bangalore", status: "ActiveCustomer", assignedUserId: exec1, companyId: apex.id, onboardingStatus: "Completed", onboardedAt: new Date("2026-01-15"), onboardedById: mgrApex },
    { customerCode: "CUST-0002", name: "GreenLeaf Energy", email: "procurement@greenleaf.in", phone: "+91-22-98765432", city: "Mumbai", status: "ActiveCustomer", assignedUserId: exec2, companyId: apex.id, onboardingStatus: "Completed", onboardedAt: new Date("2026-02-01"), onboardedById: mgrApex },
    { customerCode: "CUST-0003", name: "BlueWave Logistics", email: "ops@bluewave.co.in", phone: "+91-44-55667788", city: "Chennai", status: "Prospect", assignedUserId: exec1, companyId: apex.id },
    { customerCode: "CUST-0004", name: "Pinnacle Manufacturing", email: "buy@pinnacle.in", phone: "+91-40-11223344", city: "Hyderabad", status: "ActiveCustomer", assignedUserId: exec2, companyId: apex.id, onboardingStatus: "Completed", onboardedAt: new Date("2026-01-20"), onboardedById: mgrApex },
    { customerCode: "CUST-0005", name: "Sterling Industries", email: "vendor@sterling.com", phone: "+91-11-99887766", city: "New Delhi", status: "ActiveCustomer", assignedUserId: exec1, companyId: apex.id, onboardingStatus: "Completed", onboardedAt: new Date("2025-12-10"), onboardedById: adminApex },
    { customerCode: "CUST-0006", name: "Apex Steel Works", email: "purchase@apexsteel.in", phone: "+91-33-22334455", city: "Kolkata", status: "Prospect", assignedUserId: exec2, companyId: apex.id },
    { customerCode: "CUST-0007", name: "Crystal Polymers", email: "sales@crystalpoly.in", phone: "+91-79-44556677", city: "Ahmedabad", status: "ActiveCustomer", assignedUserId: exec1, companyId: apex.id, onboardingStatus: "Completed", onboardedAt: new Date("2026-03-05"), onboardedById: mgrApex },
    // Company B customers
    { customerCode: "CUST-0008", name: "Mahalaxmi Textiles", email: "purchase@mahalaxmi.tex", phone: "+91-251-66778899", city: "Solapur", status: "ActiveCustomer", assignedUserId: userMap["exec1@bharatmetalworks.com"], companyId: bharat.id, onboardingStatus: "Completed", onboardedAt: new Date("2026-02-15"), onboardedById: userMap["admin@bharatmetalworks.com"] },
    { customerCode: "CUST-0009", name: "Shree Balaji Metals", email: "info@balajimetals.in", phone: "+91-241-33445566", city: "Jalgaon", status: "Prospect", assignedUserId: userMap["exec1@bharatmetalworks.com"], companyId: bharat.id },
  ];

  const custMap: Record<string, string> = {};
  for (const c of customersData) {
    try {
      const cust = await prisma.customer.create({ data: c });
      custMap[c.customerCode] = cust.id;
    } catch (e: any) {
      console.log(`⚠️  Customer "${c.customerCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Customers: ${customersData.length} created`);

  // ─── Contacts (all 4 types) ──────────────────────────────────────────────
  const contactsData = [
    { name: "Anil Desai", email: "anil.desai@technova.com", phone: "+91-80-11111111", contactType: "Purchase", isPrimary: true, customerId: custMap["CUST-0001"], ownerId: exec1, companyId: apex.id },
    { name: "Meera Iyer", email: "meera.iyer@technova.com", phone: "+91-80-22222222", contactType: "Technical", isPrimary: false, customerId: custMap["CUST-0001"], ownerId: exec1, companyId: apex.id },
    { name: "Sanjay Joshi", email: "sanjay@greenleaf.in", phone: "+91-22-33333333", contactType: "Management", isPrimary: true, customerId: custMap["CUST-0002"], ownerId: exec2, companyId: apex.id },
    { name: "Kavita Nair", email: "kavita.nair@greenleaf.in", phone: "+91-22-44444444", contactType: "Finance", isPrimary: false, customerId: custMap["CUST-0002"], ownerId: exec2, companyId: apex.id },
    { name: "Ramesh Chauhan", email: "ramesh@pinnacle.in", phone: "+91-40-55555555", contactType: "Purchase", isPrimary: true, customerId: custMap["CUST-0004"], ownerId: exec2, companyId: apex.id },
    { name: "Geeta Kapoor", email: "geeta@sterling.com", phone: "+91-11-66666666", contactType: "Management", isPrimary: true, customerId: custMap["CUST-0005"], ownerId: exec1, companyId: apex.id },
    { name: "Prakash Mehta", email: "prakash@crystalpoly.in", phone: "+91-79-77777777", contactType: "Technical", isPrimary: true, customerId: custMap["CUST-0007"], ownerId: exec1, companyId: apex.id },
    { name: "Suresh Pawar", email: "suresh@mahalaxmi.tex", phone: "+91-251-88888888", contactType: "Purchase", isPrimary: true, customerId: custMap["CUST-0008"], ownerId: userMap["exec1@bharatmetalworks.com"], companyId: bharat.id },
  ];

  for (const c of contactsData) {
    try {
      await prisma.contact.create({ data: c });
    } catch (e: any) {
      console.log(`⚠️  Contact "${c.name}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Contacts: ${contactsData.length} created`);

  // ─── Tasks (7) ───────────────────────────────────────────────────────────
  const tasksData = [
    { title: "Send quotation to TechNova", description: "Prepare and send Q1 quotation", status: "Completed", priority: "High", dueDate: new Date("2026-06-10"), assignedTo: exec1, dealId: null, companyId: apex.id },
    { title: "Follow up with GreenLeaf", description: "Call Sanjay regarding proposal feedback", status: "Open", priority: "Medium", dueDate: new Date("2026-06-25"), assignedTo: exec2, companyId: apex.id },
    { title: "Schedule site visit - Pinnacle", description: "Coordinate factory visit for next week", status: "Open", priority: "High", dueDate: new Date("2026-06-28"), assignedTo: exec2, companyId: apex.id },
    { title: "Prepare comparison sheet", description: "Competitor pricing analysis for Sterling", status: "In Progress", priority: "Medium", dueDate: new Date("2026-06-30"), assignedTo: exec1, companyId: apex.id },
    { title: "Update CRM records", description: "Clean up stale lead records", status: "Open", priority: "Low", dueDate: new Date("2026-07-05"), assignedTo: exec2, companyId: apex.id },
    { title: "Send sample request - Crystal", description: "Dispatch polymer sample to customer", status: "Completed", priority: "High", dueDate: new Date("2026-06-05"), assignedTo: exec1, companyId: apex.id },
    { title: "Monthly sales report", description: "Prepare June sales pipeline report", status: "Open", priority: "Medium", dueDate: new Date("2026-07-01"), assignedTo: mgrApex, companyId: apex.id },
  ];

  for (const t of tasksData) {
    try {
      await prisma.task.create({ data: t });
    } catch (e: any) {
      console.log(`⚠️  Task "${t.title}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Tasks: ${tasksData.length} created`);

  // ─── Follow-ups (5) ──────────────────────────────────────────────────────
  const followUpsData = [
    { customerId: custMap["CUST-0001"], assignedUserId: exec1, nextMeetingDate: new Date("2026-06-22"), remarks: "Discuss Q2 requirements", status: "Pending", priority: "High", type: "Meeting", companyId: apex.id },
    { customerId: custMap["CUST-0002"], assignedUserId: exec2, nextMeetingDate: new Date("2026-06-24"), remarks: "Follow up on proposal", status: "Pending", priority: "Medium", type: "Call", companyId: apex.id },
    { customerId: custMap["CUST-0004"], assignedUserId: exec2, nextMeetingDate: new Date("2026-06-26"), remarks: "Site visit preparation", status: "Pending", priority: "High", type: "Meeting", companyId: apex.id },
    { customerId: custMap["CUST-0005"], assignedUserId: exec1, nextMeetingDate: new Date("2026-06-20"), remarks: "Contract renewal discussion", status: "Completed", priority: "Medium", type: "Call", completedAt: new Date("2026-06-18"), completedById: exec1, companyId: apex.id },
    { customerId: custMap["CUST-0007"], assignedUserId: exec1, nextMeetingDate: new Date("2026-06-28"), remarks: "Sample feedback review", status: "Pending", priority: "Medium", type: "Meeting", companyId: apex.id },
  ];

  for (const f of followUpsData) {
    try {
      await prisma.followUp.create({ data: f });
    } catch (e: any) {
      console.log(`⚠️  FollowUp skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Follow-ups: ${followUpsData.length} created`);

  // ─── Communication Logs (activities) ─────────────────────────────────────
  const commsData = [
    { customerId: custMap["CUST-0001"], channel: "Call", direction: "Outbound", status: "Completed", content: "Discussed Q2 requirements with Anil", sentByUserId: exec1, duration: 15, companyId: apex.id },
    { customerId: custMap["CUST-0002"], channel: "Email", direction: "Outbound", status: "Delivered", content: "Sent proposal to Sanjay", sentByUserId: exec2, companyId: apex.id },
    { customerId: custMap["CUST-0004"], channel: "Meeting", direction: "Outbound", status: "Completed", content: "Factory visit with Ramesh — positive response", sentByUserId: exec2, duration: 90, mode: "In-person", companyId: apex.id },
    { customerId: custMap["CUST-0005"], channel: "WhatsApp", direction: "Outbound", status: "Delivered", content: "Sent pricing update to Geeta", sentByUserId: exec1, companyId: apex.id },
    { customerId: custMap["CUST-0007"], channel: "Call", direction: "Inbound", status: "Completed", content: "Prakash called about sample specs", sentByUserId: exec1, duration: 10, companyId: apex.id },
  ];

  for (const c of commsData) {
    try {
      await prisma.communicationLog.create({ data: c });
    } catch (e: any) {
      console.log(`⚠️  CommLog skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Communication Logs: ${commsData.length} created`);

  // ─── Deals (5) ───────────────────────────────────────────────────────────
  const dealsData = [
    { dealName: "TechNova — Q2 Automation Equipment", customerId: custMap["CUST-0001"], dealValue: 2500000, expectedCloseDate: new Date("2026-07-15"), assignedUserId: exec1, status: "Active", companyId: apex.id },
    { dealName: "GreenLeaf — Solar Panel Mounts", customerId: custMap["CUST-0002"], dealValue: 1800000, expectedCloseDate: new Date("2026-06-30"), assignedUserId: exec2, status: "Active", companyId: apex.id },
    { dealName: "Pinnacle — Conveyor System Upgrade", customerId: custMap["CUST-0004"], dealValue: 3200000, expectedCloseDate: new Date("2026-08-10"), assignedUserId: exec2, status: "Active", companyId: apex.id },
    { dealName: "Sterling — Annual Supply Contract", customerId: custMap["CUST-0005"], dealValue: 5500000, expectedCloseDate: new Date("2026-09-01"), assignedUserId: exec1, status: "Active", companyId: apex.id },
    { dealName: "Crystal — Polymer Raw Material", customerId: custMap["CUST-0007"], dealValue: 950000, expectedCloseDate: new Date("2026-06-25"), assignedUserId: exec1, status: "Lost", companyId: apex.id, lostReason: "Price too competitive" },
  ];

  for (const d of dealsData) {
    try {
      await prisma.deal.create({ data: d });
    } catch (e: any) {
      console.log(`⚠️  Deal "${d.dealName}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Deals: ${dealsData.length} created`);

  console.log("\n🎉 V1 seed complete!");
  console.log("\n📋 Login credentials (password: Password@123):");
  console.log("   superadmin@sukisoft.com    — SuperAdmin");
  console.log("   admin@apexindustries.com   — Admin (Apex)");
  console.log("   manager@apexindustries.com — SalesManager (Apex)");
  console.log("   exec1@apexindustries.com   — SalesExecutive (Apex)");
  console.log("   exec2@apexindustries.com   — SalesExecutive (Apex)");
  console.log("   admin@bharatmetalworks.com — Admin (Bharat)");
  console.log("   exec1@bharatmetalworks.com — SalesExecutive (Bharat)");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
