/**
 * SUKI CRM — Seed Data Script V3
 * Manufacturing CRM: Sample Requests, Negotiations, Purchase Orders, Documents
 *
 * Run: npx ts-node prisma/seed-v3.ts
 * Prerequisite: seed-v1.ts and seed-v2.ts must be run first
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting V3 seed...\n");

  const apex = await prisma.company.findUnique({ where: { name: "Apex Industries" } });
  if (!apex) throw new Error("Run seed-v1.ts first — Apex Industries not found");

  const exec1 = await prisma.user.findUnique({ where: { email: "exec1@apexindustries.com" } });
  const exec2 = await prisma.user.findUnique({ where: { email: "exec2@apexindustries.com" } });
  const mgrApex = await prisma.user.findUnique({ where: { email: "manager@apexindustries.com" } });
  if (!exec1 || !exec2 || !mgrApex) throw new Error("Users not found — run seed-v1.ts first");

  const customers = await prisma.customer.findMany({ where: { companyId: apex.id } });
  const cust = (code: string) => customers.find((c) => c.customerCode === code);

  const contacts = await prisma.contact.findMany({ where: { companyId: apex.id } });
  const contact = (email: string) => contacts.find((c) => c.email === email);

  const products = await prisma.product.findMany({ where: { companyId: apex.id } });
  const prod = (code: string) => products.find((p) => p.productCode === code);

  const quotations = await prisma.quotation.findMany({ where: { companyId: apex.id } });
  const quo = (code: string) => quotations.find((q) => q.quotationCode === code);

  const rfqs = await prisma.rFQ.findMany({ where: { companyId: apex.id } });
  const rfq = (code: string) => rfqs.find((r) => r.rfqCode === code);

  const deals = await prisma.deal.findMany({ where: { companyId: apex.id } });

  // ─── Sample Requests (6) ─────────────────────────────────────────────────
  const samplesData = [
    { sampleCode: "SMP-0001", customerId: cust("CUST-0001")?.id, contactId: contact("anil.desai@technova.com")?.id, productId: prod("PRD-0001")?.id, rfqId: rfq("RFQ-0001")?.id, status: "Approved", requestDate: new Date("2026-01-18"), sentDate: new Date("2026-01-22"), approvedDate: new Date("2026-01-25"), quantity: 2, specifications: "SS316 material, flanged ends", assignedUserId: exec1.id, approvedById: mgrApex.id, companyId: apex.id },
    { sampleCode: "SMP-0002", customerId: cust("CUST-0002")?.id, contactId: contact("sanjay@greenleaf.in")?.id, productId: prod("PRD-0003")?.id, rfqId: rfq("RFQ-0002")?.id, status: "SentToCustomer", requestDate: new Date("2026-02-05"), sentDate: new Date("2026-02-10"), quantity: 1, specifications: "Heavy duty, 600mm belt", assignedUserId: exec2.id, companyId: apex.id },
    { sampleCode: "SMP-0003", customerId: cust("CUST-0004")?.id, contactId: contact("ramesh@pinnacle.in")?.id, productId: prod("PRD-0004")?.id, rfqId: rfq("RFQ-0003")?.id, status: "Approved", requestDate: new Date("2026-02-22"), sentDate: new Date("2026-02-28"), approvedDate: new Date("2026-03-02"), quantity: 1, specifications: "Standard roller, 5m length", assignedUserId: exec2.id, approvedById: mgrApex.id, companyId: apex.id },
    { sampleCode: "SMP-0004", customerId: cust("CUST-0005")?.id, contactId: contact("geeta@sterling.com")?.id, productId: prod("PRD-0005")?.id, rfqId: rfq("RFQ-0004")?.id, status: "UnderReview", requestDate: new Date("2026-03-05"), quantity: 1, specifications: "400A, IP54 enclosure", assignedUserId: exec1.id, companyId: apex.id },
    { sampleCode: "SMP-0005", customerId: cust("CUST-0007")?.id, contactId: contact("prakash@crystalpoly.in")?.id, productId: prod("PRD-0007")?.id, rfqId: rfq("RFQ-0005")?.id, status: "Rejected", requestDate: new Date("2026-03-18"), rejectedDate: new Date("2026-03-22"), quantity: 1, specifications: "Pneumatic, 3 inch", assignedUserId: exec1.id, rejectedById: mgrApex.id, companyId: apex.id, revisionNotes: "Customer wants different actuator type" },
    { sampleCode: "SMP-0006", customerId: cust("CUST-0001")?.id, contactId: contact("meera.iyer@technova.com")?.id, productId: prod("PRD-0006")?.id, status: "New", requestDate: new Date("2026-06-05"), quantity: 1, specifications: "200A distribution panel", assignedUserId: exec1.id, companyId: apex.id },
  ];

  for (const s of samplesData) {
    try {
      await prisma.sampleRequest.create({ data: s as any });
    } catch (e: any) {
      console.log(`⚠️  Sample "${s.sampleCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Sample Requests: ${samplesData.length}`);

  // ─── Negotiations (6) with revisions ─────────────────────────────────────
  const negotiationsData = [
    { negotiationCode: "NEG-0001", quotationId: quo("QUO-0001")?.id, dealId: deals[0]?.id, customerId: cust("CUST-0001")?.id, contactId: contact("anil.desai@technova.com")?.id, status: "Won", initialAmount: 225000, revisedAmount: 213750, finalAmount: 213750, outcome: "Won", closedAt: new Date("2026-02-01"), assignedUserId: exec1.id, companyId: apex.id, customerDemands: "5% discount and 2 week delivery", internalNotes: "Agreed on 5% discount" },
    { negotiationCode: "NEG-0002", quotationId: quo("QUO-0002")?.id, customerId: cust("CUST-0002")?.id, contactId: contact("sanjay@greenleaf.in")?.id, status: "PriceRevision", initialAmount: 570000, revisedAmount: 524400, assignedUserId: exec2.id, companyId: apex.id, customerDemands: "8% discount, extended warranty", internalNotes: "Considering 8% with 1yr warranty" },
    { negotiationCode: "NEG-0003", quotationId: quo("QUO-0003")?.id, dealId: deals[2]?.id, customerId: cust("CUST-0004")?.id, contactId: contact("ramesh@pinnacle.in")?.id, status: "Won", initialAmount: 435000, revisedAmount: 391500, finalAmount: 391500, outcome: "Won", closedAt: new Date("2026-03-10"), assignedUserId: exec2.id, companyId: apex.id, customerDemands: "10% discount for bulk order" },
    { negotiationCode: "NEG-0004", quotationId: quo("QUO-0004")?.id, customerId: cust("CUST-0005")?.id, contactId: contact("geeta@sterling.com")?.id, status: "CommercialDiscussion", initialAmount: 925000, revisedAmount: 860250, assignedUserId: exec1.id, companyId: apex.id, customerDemands: "7% discount + 30 day payment terms", internalNotes: "Negotiating payment terms" },
    { negotiationCode: "NEG-0005", quotationId: quo("QUO-0005")?.id, customerId: cust("CUST-0007")?.id, contactId: contact("prakash@crystalpoly.in")?.id, status: "Lost", initialAmount: 220000, outcome: "Lost", closedAt: new Date("2026-04-01"), assignedUserId: exec1.id, companyId: apex.id, customerDemands: "15% discount — not viable for us" },
    { negotiationCode: "NEG-0006", quotationId: quo("QUO-0007")?.id, customerId: cust("CUST-0002")?.id, status: "Active", initialAmount: 285000, revisedAmount: 250800, assignedUserId: exec2.id, companyId: apex.id, customerDemands: "12% discount on repeat order" },
  ];

  const negMap: Record<string, string> = {};
  for (const n of negotiationsData) {
    try {
      const neg = await prisma.negotiation.create({ data: n as any });
      negMap[n.negotiationCode] = neg.id;
    } catch (e: any) {
      console.log(`⚠️  Negotiation "${n.negotiationCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }

  // Negotiation revisions
  const revisionsData = [
    { negotiationId: negMap["NEG-0001"], revisionNumber: 1, proposedAmount: 213750, discountPercent: 5, reason: "5% discount agreed", status: "Approved", createdById: exec1.id },
    { negotiationId: negMap["NEG-0002"], revisionNumber: 1, proposedAmount: 524400, discountPercent: 8, reason: "8% discount proposed", status: "Pending", createdById: exec2.id },
    { negotiationId: negMap["NEG-0003"], revisionNumber: 1, proposedAmount: 391500, discountPercent: 10, reason: "10% bulk discount", status: "Approved", createdById: exec2.id },
    { negotiationId: negMap["NEG-0004"], revisionNumber: 1, proposedAmount: 860250, discountPercent: 7, reason: "7% with 30 day terms", status: "Pending", createdById: exec1.id },
    { negotiationId: negMap["NEG-0006"], revisionNumber: 1, proposedAmount: 250800, discountPercent: 12, reason: "12% repeat order discount", status: "Pending", createdById: exec2.id },
  ];

  for (const r of revisionsData) {
    try {
      await prisma.negotiationRevision.create({ data: r });
    } catch (e: any) {
      console.log(`⚠️  Revision skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Negotiations: ${negotiationsData.length}, Revisions: ${revisionsData.length}`);

  // ─── Purchase Orders (5, 1 with failed ERP sync) ────────────────────────
  const posData = [
    { poCode: "PO-0001", customerId: cust("CUST-0001")?.id, contactId: contact("anil.desai@technova.com")?.id, negotiationId: negMap["NEG-0001"], quotationId: quo("QUO-0001")?.id, dealId: deals[0]?.id, status: "Approved", poNumber: "TN-PO-2026-001", poDate: new Date("2026-02-05"), expectedDelivery: new Date("2026-03-15"), totalAmount: 225000, discountPercent: 5, finalAmount: 213750, paymentTerms: "Net 30", deliveryTerms: "FOB Bangalore", shippingAddress: "TechNova Solutions, Whitefield, Bangalore 560066", assignedUserId: exec1.id, approvedById: mgrApex.id, approvedAt: new Date("2026-02-06"), companyId: apex.id, erpSyncStatus: "Synced", erpSyncedAt: new Date("2026-02-07"), erpReferenceNumber: "ERP-REF-001", erpResponse: '{"status":"success","id":"ERP-REF-001"}', items: { create: [{ productId: prod("PRD-0001")?.id, description: "High-Pressure Ball Valve 2\"", quantity: 50, unitPrice: 4500, totalPrice: 225000 }] } },
    { poCode: "PO-0002", customerId: cust("CUST-0004")?.id, contactId: contact("ramesh@pinnacle.in")?.id, negotiationId: negMap["NEG-0003"], quotationId: quo("QUO-0003")?.id, dealId: deals[2]?.id, status: "Approved", poNumber: "PN-PO-2026-003", poDate: new Date("2026-03-12"), expectedDelivery: new Date("2026-04-20"), totalAmount: 435000, discountPercent: 10, finalAmount: 391500, paymentTerms: "Net 45", deliveryTerms: "FOR Hyderabad", shippingAddress: "Pinnacle Manufacturing, Industrial Area, Hyderabad 500018", assignedUserId: exec2.id, approvedById: mgrApex.id, approvedAt: new Date("2026-03-13"), companyId: apex.id, erpSyncStatus: "Synced", erpSyncedAt: new Date("2026-03-14"), erpReferenceNumber: "ERP-REF-002", erpResponse: '{"status":"success","id":"ERP-REF-002"}', items: { create: [{ productId: prod("PRD-0004")?.id, description: "Roller Conveyor 5m Standard", quantity: 3, unitPrice: 145000, totalPrice: 435000 }] } },
    { poCode: "PO-0003", customerId: cust("CUST-0001")?.id, contactId: contact("anil.desai@technova.com")?.id, status: "UnderValidation", poNumber: "TN-PO-2026-002", poDate: new Date("2026-06-10"), expectedDelivery: new Date("2026-07-20"), totalAmount: 285000, discountPercent: 5, finalAmount: 270750, paymentTerms: "Net 30", deliveryTerms: "FOB Bangalore", assignedUserId: exec1.id, companyId: apex.id, items: { create: [{ productId: prod("PRD-0006")?.id, description: "Distribution Panel 200A", quantity: 3, unitPrice: 95000, totalPrice: 285000 }] } },
    { poCode: "PO-0004", customerId: cust("CUST-0005")?.id, contactId: contact("geeta@sterling.com")?.id, status: "New", poNumber: "ST-PO-2026-001", poDate: new Date("2026-06-15"), expectedDelivery: new Date("2026-08-01"), totalAmount: 925000, discountPercent: 7, finalAmount: 860250, paymentTerms: "Net 60", deliveryTerms: "FOR Delhi", shippingAddress: "Sterling Industries, Okhla Phase 2, New Delhi 110020", assignedUserId: exec1.id, companyId: apex.id, items: { create: [{ productId: prod("PRD-0005")?.id, description: "MCC Panel 400A", quantity: 5, unitPrice: 185000, totalPrice: 925000 }] } },
    // PO with intentionally failed ERP sync — use to test retry button
    { poCode: "PO-0005", customerId: cust("CUST-0002")?.id, contactId: contact("sanjay@greenleaf.in")?.id, quotationId: quo("QUO-0002")?.id, status: "Approved", poNumber: "GL-PO-2026-002", poDate: new Date("2026-06-08"), expectedDelivery: new Date("2026-07-30"), totalAmount: 570000, discountPercent: 8, finalAmount: 524400, paymentTerms: "Net 30", deliveryTerms: "FOB Mumbai", shippingAddress: "GreenLeaf Energy, Andheri East, Mumbai 400069", assignedUserId: exec2.id, approvedById: mgrApex.id, approvedAt: new Date("2026-06-09"), companyId: apex.id, erpSyncStatus: "Failed", erpResponse: '{"error":"Connection timeout","type":"AbortError"}', items: { create: [{ productId: prod("PRD-0003")?.id, description: "Belt Conveyor 10m Heavy Duty", quantity: 2, unitPrice: 285000, totalPrice: 570000 }] } },
  ];

  for (const p of posData) {
    try {
      await prisma.purchaseOrder.create({ data: p as any });
    } catch (e: any) {
      console.log(`⚠️  PO "${p.poCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Purchase Orders: ${posData.length} (1 with failed ERP sync — PO-0005)`);

  // ─── Documents (7) ───────────────────────────────────────────────────────
  const docsData = [
    { documentCode: "DOC-0001", name: "TechNova Q2 Quotation.pdf", documentType: "Quotation", entityType: "Quotation", entityId: quo("QUO-0001")?.id || "unknown", fileUrl: "/uploads/quotations/quo-0001.pdf", fileSize: 245000, mimeType: "application/pdf", uploadedById: exec1.id, companyId: apex.id, customerId: cust("CUST-0001")?.id },
    { documentCode: "DOC-0002", name: "GreenLeaf Proposal.pdf", documentType: "Quotation", entityType: "Quotation", entityId: quo("QUO-0002")?.id || "unknown", fileUrl: "/uploads/quotations/quo-0002.pdf", fileSize: 310000, mimeType: "application/pdf", uploadedById: exec2.id, companyId: apex.id, customerId: cust("CUST-0002")?.id },
    { documentCode: "DOC-0003", name: "Pinnacle Site Assessment.pdf", documentType: "Other", entityType: "Customer", entityId: cust("CUST-0004")?.id || "unknown", fileUrl: "/uploads/customers/site-assessment.pdf", fileSize: 180000, mimeType: "application/pdf", uploadedById: exec2.id, companyId: apex.id, customerId: cust("CUST-0004")?.id },
    { documentCode: "DOC-0004", name: "PO-0001 Signed PO.pdf", documentType: "PurchaseOrder", entityType: "PurchaseOrder", entityId: "po-0001", fileUrl: "/uploads/pos/po-0001.pdf", fileSize: 95000, mimeType: "application/pdf", uploadedById: exec1.id, companyId: apex.id, customerId: cust("CUST-0001")?.id },
    { documentCode: "DOC-0005", name: "Ball Valve Datasheet.pdf", documentType: "Product", entityType: "Product", entityId: prod("PRD-0001")?.id || "unknown", fileUrl: "/uploads/products/prd-0001-datasheet.pdf", fileSize: 420000, mimeType: "application/pdf", uploadedById: exec1.id, companyId: apex.id },
    { documentCode: "DOC-0006", name: "Sample Test Report SMP-0001.pdf", documentType: "Sample", entityType: "SampleRequest", entityId: "smp-0001", fileUrl: "/uploads/samples/smp-0001-report.pdf", fileSize: 156000, mimeType: "application/pdf", uploadedById: exec1.id, companyId: apex.id, customerId: cust("CUST-0001")?.id },
    { documentCode: "DOC-0007", name: "Sterling Contract Draft.pdf", documentType: "Contract", entityType: "Customer", entityId: cust("CUST-0005")?.id || "unknown", fileUrl: "/uploads/customers/sterling-contract.pdf", fileSize: 520000, mimeType: "application/pdf", uploadedById: exec1.id, companyId: apex.id, customerId: cust("CUST-0005")?.id },
  ];

  for (const d of docsData) {
    try {
      await prisma.cRMDocument.create({ data: d as any });
    } catch (e: any) {
      console.log(`⚠️  Document "${d.documentCode}" skipped: ${e.message?.slice(0, 80)}`);
    }
  }
  console.log(`✅ Documents: ${docsData.length}`);

  console.log("\n🎉 V3 seed complete!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
