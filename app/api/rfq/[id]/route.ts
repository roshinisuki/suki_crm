import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

const VALID_STATUSES = ["New", "UnderReview", "CostingPending", "QuotationCreated", "Closed"];
const RFQ_STATUS_ORDER = ["New", "UnderReview", "CostingPending", "QuotationCreated", "Closed"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rfq = await prisma.rFQ.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    include: {
      customer: { select: { id: true, name: true, customerCode: true, phone: true, email: true, city: true } },
      contact: { select: { id: true, name: true, email: true, phone: true, title: true } },
      product: { select: { id: true, name: true, productCode: true, unit: true, basePrice: true } },
      assignedUser: { select: { id: true, name: true, email: true } },
      costingOwner: { select: { id: true, name: true, email: true } },
      opportunity: { select: { id: true, dealName: true, opportunityCode: true, status: true } },
      lineItems: { include: { product: { select: { id: true, name: true, productCode: true, unit: true } } }, orderBy: { displayOrder: "asc" } },
      costingSheets: { include: { submittedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      rfqStatusHistories: { include: { changedBy: { select: { id: true, name: true } } }, orderBy: { changedAt: "desc" } },
      quotations: { select: { id: true, quotationCode: true, status: true, finalAmount: true } },
    },
  });

  if (!rfq) return NextResponse.json({ success: false, message: "RFQ not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: rfq });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.rFQ.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
  });
  if (!existing) return NextResponse.json({ success: false, message: "RFQ not found" }, { status: 404 });

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
  }

  if (body.status && body.status !== existing.status) {
    const currentIndex = RFQ_STATUS_ORDER.indexOf(existing.status);
    const newIndex = RFQ_STATUS_ORDER.indexOf(body.status);
    if (newIndex > currentIndex + 1) {
      return NextResponse.json(
        { success: false, message: `Cannot skip RFQ statuses. Move to ${RFQ_STATUS_ORDER[currentIndex + 1]} first.` },
        { status: 400 }
      );
    }
  }

  const updateData: any = {};
  if (body.customerId !== undefined) updateData.customerId = body.customerId;
  if (body.contactId !== undefined) updateData.contactId = body.contactId || null;
  if (body.productId !== undefined) updateData.productId = body.productId || null;
  if (body.quantity !== undefined) updateData.quantity = body.quantity ? parseFloat(body.quantity) : null;
  if (body.targetPrice !== undefined) updateData.targetPrice = body.targetPrice ? parseFloat(body.targetPrice) : null;
  if (body.deliveryDate !== undefined) updateData.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null;
  if (body.requirementDetails !== undefined) updateData.requirementDetails = body.requirementDetails || null;
  if (body.assignedUserId !== undefined) updateData.assignedUserId = body.assignedUserId || null;
  if (body.notes !== undefined) updateData.notes = body.notes || null;
  if (body.status !== undefined) updateData.status = body.status;

  const rfq = await prisma.rFQ.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, name: true, customerCode: true } },
      product: { select: { id: true, name: true, productCode: true } },
      assignedUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: rfq });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.rFQ.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
  });
  if (!existing) return NextResponse.json({ success: false, message: "RFQ not found" }, { status: 404 });

  await prisma.rFQ.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: user.id },
  });

  return NextResponse.json({ success: true, message: "RFQ deleted" });
}
