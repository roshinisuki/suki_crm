import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit, extractAuditContext } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;

  const where: any = {
    deletedAt: null,
    companyId: user.companyId,
  };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quotation.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: quotations, total, page, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const body = await request.json();

  // Validate customer
  if (!body.customerId) {
    return NextResponse.json({ success: false, message: "Customer is required" }, { status: 400 });
  }

  // Validate validity date
  const validUntil = new Date(body.validUntil);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (validUntil < today) {
    return NextResponse.json({ success: false, message: "Validity date must be today or later" }, { status: 400 });
  }

  const discountPercent = parseFloat(body.discountPercent) || 0;

  // If rfq_id provided, copy line items from RFQ
  let rfqLineItems: any[] = [];
  let rfqUnitPrice = 0;
  if (body.rfqId) {
    const rfq = await prisma.rFQ.findFirst({
      where: { id: body.rfqId, deletedAt: null, companyId: user.companyId },
      include: {
        lineItems: { include: { product: { select: { id: true, productCode: true, unit: true } } }, orderBy: { displayOrder: "asc" } },
        costingSheets: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!rfq) {
      return NextResponse.json({ success: false, message: "RFQ not found" }, { status: 404 });
    }
    rfqLineItems = rfq.lineItems;
    rfqUnitPrice = rfq.costingSheets[0]?.computedUnitPrice || 0;
  }

  // Build items list: from body or from RFQ
  let items: any[];
  if (rfqLineItems.length > 0 && (!body.items || body.items.length === 0)) {
    items = rfqLineItems.map((li: any) => ({
      productId: li.productId || null,
      description: li.itemDescription,
      quantity: li.quantity,
      unitPrice: rfqUnitPrice,
      discountPercent: 0,
      taxPercent: 18,
      hsn: null,
      unit: li.unit || null,
    }));
  } else {
    items = body.items || [];
  }

  if (items.length === 0) {
    return NextResponse.json({ success: false, message: "At least 1 line item is required" }, { status: 400 });
  }

  // ── SERVER-COMPUTE ALL TOTALS ──
  let subtotal = 0;
  let taxAmount = 0;

  const computedItems = items.map((item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const lineDiscount = parseFloat(item.discountPercent) || 0;
    const taxPercent = parseFloat(item.taxPercent) || 18;

    const lineTotal = qty * unitPrice * (1 - lineDiscount / 100);
    const lineTax = lineTotal * (taxPercent / 100);

    subtotal += lineTotal;
    taxAmount += lineTax;

    return {
      productId: item.productId || null,
      description: item.description,
      quantity: qty,
      unitPrice,
      totalPrice: lineTotal,
      discountPercent: lineDiscount,
      taxPercent,
      lineTotal,
      hsn: item.hsn || null,
      unit: item.unit || null,
      notes: item.notes || null,
    };
  });

  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - discountAmount + taxAmount;

  // Generate quotation code: QT-YYYY-NNNNN
  const year = new Date().getFullYear();
  const yearCount = await prisma.quotation.count({
    where: {
      companyId: user.companyId,
      quotationCode: { startsWith: `QT-${year}-` },
    },
  });
  const quotationCode = `QT-${year}-${String(yearCount + 1).padStart(5, "0")}`;

  try {
    const quotation = await prisma.$transaction(async (tx) => {
      // 1. Create quotation
      const q = await tx.quotation.create({
        data: {
          quotationCode,
          rfqId: body.rfqId || null,
          customerId: body.customerId,
          contactId: body.contactId || null,
          dealId: body.dealId || null,
          validUntil,
          discountPercent,
          totalAmount: subtotal,
          subtotal,
          taxAmount,
          finalAmount: grandTotal,
          termsAndConditions: body.termsAndConditions || null,
          paymentTerms: body.paymentTerms || null,
          deliveryTerms: body.deliveryTerms || null,
          freightTerms: body.freightTerms || null,
          leadTimeDays: body.leadTimeDays ? parseInt(body.leadTimeDays) : null,
          revisionNumber: 1,
          status: "Draft",
          createdById: user.id,
          assignedUserId: body.assignedUserId || null,
          companyId: user.companyId,
        },
      });

      // 2. Create line items
      for (const item of computedItems) {
        await tx.quotationItem.create({
          data: { quotationId: q.id, ...item },
        });
      }

      // 3. Insert quotation_status_history
      await tx.quotationStatusHistory.create({
        data: {
          quotationId: q.id,
          fromStatus: null,
          toStatus: "Draft",
          changedById: user.id,
          notes: "Quotation created",
        },
      });

      return q;
    });

    const fullQuotation = await prisma.quotation.findUnique({
      where: { id: quotation.id },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        items: { include: { product: { select: { id: true, name: true, productCode: true } } } },
      },
    });

    await logAudit(user.id, "Quotation", "Create", `Created quotation ${quotationCode}`, {
      resourceId: quotation.id,
      newState: { quotationCode, customerId: body.customerId, subtotal, taxAmount, grandTotal, status: "Draft" },
      context: extractAuditContext(request),
    });

    return NextResponse.json({ success: true, data: fullQuotation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Failed to create quotation: ${error.message}` },
      { status: 500 }
    );
  }
}
