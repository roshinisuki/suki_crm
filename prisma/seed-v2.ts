/**
 * SUKI CRM — Seed Data Script V2
 * Pipeline & Quotations: Stages, Products, RFQs, Quotations, Visits, Activities, Forecasts
 *
 * Run: npx ts-node prisma/seed-v2.ts
 * Prerequisite: seed-v1.ts must be run first
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting V2 seed...\n");

  const apex = await prisma.company.findUnique({ where: { name: "Apex Industries" } });
  const bharat = await prisma.company.findUnique({ where: { name: "Bharat Metal Works" } });
  if (!apex) throw new Error("Run seed-v1.ts first — Apex Industries not found");

  const exec1 = await prisma.user.findUnique({ where: { email: "exec1@apexindustries.com" } });
  const exec2 = await prisma.user.findUnique({ where: { email: "exec2@apexindustries.com" } });
  const mgrApex = await prisma.user.findUnique({ where: { email: "manager@apexindustries.com" } });
  if (!exec1 || !exec2 || !mgrApex) throw new Error("Users not found — run seed-v1.ts first");

  const customers = await prisma.customer.findMany({ where: { companyId: apex.id } });
  const cust = (code: string) => customers.find((c) => c.customerCode === code);
  if (customers.length === 0) throw new Error("No customers found — run seed-v1.ts first");

  // ─── Pipeline Stages ─────────────────────────────────────────────────────
  const stages = [
    { name: "Lead In", order: 1, color: "#6366F1", companyId: apex.id },
    { name: "Qualified", order: 2, color: "#8B5CF6", companyId: apex.id },
    { name: "Proposal Sent", order: 3, color: "#EC4899", companyId: apex.id },
    { name: "Negotiation", order: 4, color: "#F59E0B", companyId: apex.id },
    { name: "Closed Won", order: 5, color: "#10B981", companyId: apex.id },
    { name: "Closed Lost", order: 6, color: "#EF4444", companyId: apex.id },
  ];

  for (const s of stages) {
    try {
      await prisma.pipelineStage.create({ data: s });
    } catch (e: any) {
      console.log(`⚠️  PipelineStage "${s.name}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Pipeline Stages: ${stages.length}`);

  // ─── Product Categories ──────────────────────────────────────────────────
  const categories = [
    { name: "Industrial Valves", description: "Pressure valves, control valves, gate valves", companyId: apex.id },
    { name: "Conveyor Systems", description: "Belt conveyors, roller conveyors, automated lines", companyId: apex.id },
    { name: "Electrical Panels", description: "Distribution panels, control panels, MCC panels", companyId: apex.id },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    try {
      const cat = await prisma.productCategory.create({ data: c });
      catMap[c.name] = cat.id;
    } catch (e: any) {
      console.log(`⚠️  Category "${c.name}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Product Categories: ${categories.length}`);

  // ─── Products with specs ─────────────────────────────────────────────────
  const productsData = [
    { productCode: "PRD-0001", name: "High-Pressure Ball Valve 2\"", categoryId: catMap["Industrial Valves"], unit: "PCS", basePrice: 4500, productType: "FinishedGood", minOrderQuantity: 10, companyId: apex.id },
    { productCode: "PRD-0002", name: "Gate Valve 4\" Cast Iron", categoryId: catMap["Industrial Valves"], unit: "PCS", basePrice: 8200, productType: "FinishedGood", minOrderQuantity: 5, companyId: apex.id },
    { productCode: "PRD-0003", name: "Belt Conveyor 10m — Heavy Duty", categoryId: catMap["Conveyor Systems"], unit: "SET", basePrice: 285000, productType: "FinishedGood", minOrderQuantity: 1, companyId: apex.id },
    { productCode: "PRD-0004", name: "Roller Conveyor 5m — Standard", categoryId: catMap["Conveyor Systems"], unit: "SET", basePrice: 145000, productType: "FinishedGood", minOrderQuantity: 1, companyId: apex.id },
    { productCode: "PRD-0005", name: "MCC Panel — 400A", categoryId: catMap["Electrical Panels"], unit: "PCS", basePrice: 185000, productType: "FinishedGood", minOrderQuantity: 1, companyId: apex.id },
    { productCode: "PRD-0006", name: "Distribution Panel — 200A", categoryId: catMap["Electrical Panels"], unit: "PCS", basePrice: 95000, productType: "FinishedGood", minOrderQuantity: 1, companyId: apex.id },
    { productCode: "PRD-0007", name: "Control Valve 3\" — Pneumatic", categoryId: catMap["Industrial Valves"], unit: "PCS", basePrice: 22000, productType: "FinishedGood", minOrderQuantity: 2, companyId: apex.id },
  ];

  const prodMap: Record<string, string> = {};
  for (const p of productsData) {
    try {
      const prod = await prisma.product.create({ data: p });
      prodMap[p.productCode] = prod.id;
    } catch (e: any) {
      console.log(`⚠️  Product "${p.productCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }

  // Product specifications
  const specsData = [
    { productId: prodMap["PRD-0001"], specKey: "Pressure Rating", specValue: "300 PSI", unit: "PSI", displayOrder: 1 },
    { productId: prodMap["PRD-0001"], specKey: "Material", specValue: "SS316", displayOrder: 2 },
    { productId: prodMap["PRD-0001"], specKey: "End Connection", specValue: "Flanged", displayOrder: 3 },
    { productId: prodMap["PRD-0003"], specKey: "Belt Width", specValue: "600", unit: "mm", displayOrder: 1 },
    { productId: prodMap["PRD-0003"], specKey: "Load Capacity", specValue: "500", unit: "kg/m", displayOrder: 2 },
    { productId: prodMap["PRD-0003"], specKey: "Motor Power", specValue: "5.5", unit: "kW", displayOrder: 3 },
    { productId: prodMap["PRD-0005"], specKey: "Current Rating", specValue: "400", unit: "A", displayOrder: 1 },
    { productId: prodMap["PRD-0005"], specKey: "Enclosure", specValue: "IP54", displayOrder: 2 },
    { productId: prodMap["PRD-0005"], specKey: "Bus Bar", specValue: "Copper", displayOrder: 3 },
  ];

  for (const s of specsData) {
    try {
      await prisma.productSpecification.create({ data: s });
    } catch (e: any) {
      console.log(`⚠️  Spec skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Products: ${productsData.length}, Specs: ${specsData.length}`);

  // ─── RFQs (6) ────────────────────────────────────────────────────────────
  const rfqsData = [
    { rfqCode: "RFQ-0001", customerId: cust("CUST-0001")?.id, productId: prodMap["PRD-0001"], status: "Quoted", receivedDate: new Date("2026-01-15"), targetPrice: 4200, quantity: 50, assignedUserId: exec1.id, requirementDetails: "50 units ball valve for Q2 project", companyId: apex.id },
    { rfqCode: "RFQ-0002", customerId: cust("CUST-0002")?.id, productId: prodMap["PRD-0003"], status: "Quoted", receivedDate: new Date("2026-02-01"), targetPrice: 270000, quantity: 2, assignedUserId: exec2.id, requirementDetails: "2 heavy duty belt conveyors", companyId: apex.id },
    { rfqCode: "RFQ-0003", customerId: cust("CUST-0004")?.id, productId: prodMap["PRD-0004"], status: "Quoted", receivedDate: new Date("2026-02-20"), targetPrice: 140000, quantity: 3, assignedUserId: exec2.id, requirementDetails: "3 roller conveyors for packaging line", companyId: apex.id },
    { rfqCode: "RFQ-0004", customerId: cust("CUST-0005")?.id, productId: prodMap["PRD-0005"], status: "Quoted", receivedDate: new Date("2026-03-01"), targetPrice: 180000, quantity: 5, assignedUserId: exec1.id, requirementDetails: "5 MCC panels for new factory wing", companyId: apex.id },
    { rfqCode: "RFQ-0005", customerId: cust("CUST-0007")?.id, productId: prodMap["PRD-0007"], status: "Quoted", receivedDate: new Date("2026-03-15"), targetPrice: 21000, quantity: 10, assignedUserId: exec1.id, requirementDetails: "10 pneumatic control valves", companyId: apex.id },
    { rfqCode: "RFQ-0006", customerId: cust("CUST-0001")?.id, productId: prodMap["PRD-0006"], status: "New", receivedDate: new Date("2026-06-01"), targetPrice: 90000, quantity: 3, assignedUserId: exec1.id, requirementDetails: "3 distribution panels — urgent", companyId: apex.id },
  ];

  const rfqMap: Record<string, string> = {};
  for (const r of rfqsData) {
    try {
      const rfq = await prisma.rFQ.create({ data: r as any });
      rfqMap[r.rfqCode] = rfq.id;
    } catch (e: any) {
      console.log(`⚠️  RFQ "${r.rfqCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ RFQs: ${rfqsData.length}`);

  // ─── Quotations (9, spread over 6 months) ────────────────────────────────
  const quotationsData = [
    { quotationCode: "QUO-0001", rfqId: rfqMap["RFQ-0001"], customerId: cust("CUST-0001")?.id, dealId: null, validUntil: new Date("2026-04-15"), discountPercent: 5, totalAmount: 225000, finalAmount: 213750, status: "Accepted", createdById: exec1.id, companyId: apex.id, sentAt: new Date("2026-01-20"), acceptedAt: new Date("2026-02-01"), items: { create: [{ productId: prodMap["PRD-0001"], description: "High-Pressure Ball Valve 2\"", quantity: 50, unitPrice: 4500, totalPrice: 225000 }] } },
    { quotationCode: "QUO-0002", rfqId: rfqMap["RFQ-0002"], customerId: cust("CUST-0002")?.id, validUntil: new Date("2026-05-01"), discountPercent: 8, totalAmount: 570000, finalAmount: 524400, status: "Sent", createdById: exec2.id, companyId: apex.id, sentAt: new Date("2026-02-05"), items: { create: [{ productId: prodMap["PRD-0003"], description: "Belt Conveyor 10m Heavy Duty", quantity: 2, unitPrice: 285000, totalPrice: 570000 }] } },
    { quotationCode: "QUO-0003", rfqId: rfqMap["RFQ-0003"], customerId: cust("CUST-0004")?.id, validUntil: new Date("2026-05-20"), discountPercent: 10, totalAmount: 435000, finalAmount: 391500, status: "Accepted", createdById: exec2.id, companyId: apex.id, sentAt: new Date("2026-02-25"), acceptedAt: new Date("2026-03-10"), items: { create: [{ productId: prodMap["PRD-0004"], description: "Roller Conveyor 5m Standard", quantity: 3, unitPrice: 145000, totalPrice: 435000 }] } },
    { quotationCode: "QUO-0004", rfqId: rfqMap["RFQ-0004"], customerId: cust("CUST-0005")?.id, validUntil: new Date("2026-06-01"), discountPercent: 7, totalAmount: 925000, finalAmount: 860250, status: "Sent", createdById: exec1.id, companyId: apex.id, sentAt: new Date("2026-03-05"), items: { create: [{ productId: prodMap["PRD-0005"], description: "MCC Panel 400A", quantity: 5, unitPrice: 185000, totalPrice: 925000 }] } },
    { quotationCode: "QUO-0005", rfqId: rfqMap["RFQ-0005"], customerId: cust("CUST-0007")?.id, validUntil: new Date("2026-06-15"), discountPercent: 0, totalAmount: 220000, finalAmount: 220000, status: "Rejected", createdById: exec1.id, companyId: apex.id, sentAt: new Date("2026-03-20"), rejectedAt: new Date("2026-04-01"), rejectionReason: "Price too high compared to competitor", items: { create: [{ productId: prodMap["PRD-0007"], description: "Control Valve 3\" Pneumatic", quantity: 10, unitPrice: 22000, totalPrice: 220000 }] } },
    { quotationCode: "QUO-0006", customerId: cust("CUST-0001")?.id, validUntil: new Date("2026-08-01"), discountPercent: 5, totalAmount: 285000, finalAmount: 270750, status: "Draft", createdById: exec1.id, companyId: apex.id, items: { create: [{ productId: prodMap["PRD-0006"], description: "Distribution Panel 200A", quantity: 3, unitPrice: 95000, totalPrice: 285000 }] } },
    { quotationCode: "QUO-0007", customerId: cust("CUST-0002")?.id, validUntil: new Date("2026-07-15"), discountPercent: 12, totalAmount: 285000, finalAmount: 250800, status: "Sent", createdById: exec2.id, companyId: apex.id, sentAt: new Date("2026-04-10"), items: { create: [{ productId: prodMap["PRD-0003"], description: "Belt Conveyor 10m — repeat order", quantity: 1, unitPrice: 285000, totalPrice: 285000 }] } },
    { quotationCode: "QUO-0008", customerId: cust("CUST-0004")?.id, validUntil: new Date("2026-09-01"), discountPercent: 5, totalAmount: 164000, finalAmount: 155800, status: "Draft", createdById: exec2.id, companyId: apex.id, items: { create: [{ productId: prodMap["PRD-0002"], description: "Gate Valve 4\" Cast Iron", quantity: 20, unitPrice: 8200, totalPrice: 164000 }] } },
    { quotationCode: "QUO-0009", customerId: cust("CUST-0005")?.id, validUntil: new Date("2026-09-15"), discountPercent: 10, totalAmount: 950000, finalAmount: 855000, status: "UnderReview", createdById: exec1.id, companyId: apex.id, sentAt: new Date("2026-05-15"), items: { create: [{ productId: prodMap["PRD-0006"], description: "Distribution Panel 200A — bulk", quantity: 10, unitPrice: 95000, totalPrice: 950000 }] } },
  ];

  for (const q of quotationsData) {
    try {
      await prisma.quotation.create({ data: q as any });
    } catch (e: any) {
      console.log(`⚠️  Quotation "${q.quotationCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Quotations: ${quotationsData.length}`);

  // ─── Marketing Visits (6) ────────────────────────────────────────────────
  const visitsData = [
    { executiveId: exec1.id, customerId: cust("CUST-0001")?.id, checkIn: new Date("2026-06-10T10:00:00"), checkOut: new Date("2026-06-10T11:30:00"), remarks: "Product demo for Q2 automation project", status: "COMPLETED", purpose: "Product Demo", outcome: "Positive — quotation requested", companyId: apex.id },
    { executiveId: exec2.id, customerId: cust("CUST-0002")?.id, checkIn: new Date("2026-06-12T14:00:00"), checkOut: new Date("2026-06-12T15:00:00"), remarks: "Follow up on solar panel mounts proposal", status: "COMPLETED", purpose: "Follow-up Meeting", outcome: "Awaiting approval from management", companyId: apex.id },
    { executiveId: exec2.id, customerId: cust("CUST-0004")?.id, checkIn: new Date("2026-06-15T09:30:00"), checkOut: new Date("2026-06-15T12:00:00"), remarks: "Site assessment for conveyor installation", status: "COMPLETED", purpose: "Site Visit", outcome: "Good fit — proceeding with detailed quote", companyId: apex.id },
    { executiveId: exec1.id, customerId: cust("CUST-0005")?.id, checkIn: new Date("2026-06-18T11:00:00"), checkOut: new Date("2026-06-18T12:00:00"), remarks: "Annual contract renewal discussion", status: "COMPLETED", purpose: "Contract Discussion", outcome: "Verbal agreement — awaiting PO", companyId: apex.id },
    { executiveId: exec1.id, customerId: cust("CUST-0007")?.id, checkIn: new Date("2026-06-20T15:00:00"), checkOut: new Date("2026-06-20T16:00:00"), remarks: "Sample delivery and feedback collection", status: "COMPLETED", purpose: "Sample Delivery", outcome: "Customer evaluating — follow up in 1 week", companyId: apex.id },
    { executiveId: exec2.id, customerId: cust("CUST-0006")?.id, status: "REQUESTED", purpose: "Initial Visit", remarks: "First meeting with prospect", companyId: apex.id },
  ];

  for (const v of visitsData) {
    try {
      await prisma.marketingVisit.create({ data: v as any });
    } catch (e: any) {
      console.log(`⚠️  Visit skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Marketing Visits: ${visitsData.length}`);

  // ─── Email / WhatsApp Activities ─────────────────────────────────────────
  const emailActivities = [
    { customerId: cust("CUST-0001")?.id, channel: "Email", direction: "Outbound", status: "Delivered", content: "Sent Q2 quotation follow-up email to Anil", sentByUserId: exec1.id, companyId: apex.id, sentAt: new Date("2026-06-15") },
    { customerId: cust("CUST-0002")?.id, channel: "Email", direction: "Outbound", status: "Delivered", content: "Proposal revision sent to Sanjay", sentByUserId: exec2.id, companyId: apex.id, sentAt: new Date("2026-06-16") },
    { customerId: cust("CUST-0005")?.id, channel: "WhatsApp", direction: "Outbound", status: "Delivered", content: "Sent pricing update via WhatsApp to Geeta", sentByUserId: exec1.id, companyId: apex.id, sentAt: new Date("2026-06-18") },
    { customerId: cust("CUST-0004")?.id, channel: "Email", direction: "Inbound", status: "Completed", content: "Ramesh confirmed site visit date via email", sentByUserId: exec2.id, companyId: apex.id, sentAt: new Date("2026-06-12") },
  ];

  for (const a of emailActivities) {
    try {
      await prisma.communicationLog.create({ data: a as any });
    } catch (e: any) {
      console.log(`⚠️  Activity skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Email/WhatsApp Activities: ${emailActivities.length}`);

  // ─── Forecast Entries (18) ───────────────────────────────────────────────
  const forecastData: any[] = [];
  const months = [1, 2, 3, 4, 5, 6];
  const execs = [exec1.id, exec2.id, mgrApex.id];
  const types = ["Revenue", "Deals", "NewCustomers"];
  for (const m of months) {
    for (const userId of execs) {
      for (const type of types) {
        forecastData.push({
          month: m, year: 2026, forecastType: type,
          targetAmount: type === "Revenue" ? 500000 + Math.random() * 500000 : type === "Deals" ? 5 + Math.floor(Math.random() * 5) : 3 + Math.floor(Math.random() * 3),
          achievedAmount: type === "Revenue" ? 300000 + Math.random() * 400000 : type === "Deals" ? 2 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 3),
          assignedUserId: userId, companyId: apex.id,
        });
      }
    }
  }

  for (const f of forecastData) {
    try {
      await prisma.forecastEntry.create({ data: f });
    } catch (e: any) {
      console.log(`⚠️  Forecast skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Forecast Entries: ${forecastData.length}`);

  console.log("\n🎉 V2 seed complete!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
