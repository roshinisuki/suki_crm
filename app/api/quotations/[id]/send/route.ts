import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit, extractAuditContext } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.quotation.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    include: {
      items: true,
      customer: { select: { id: true, name: true } },
      quotationApprovals: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!existing) return NextResponse.json({ success: false, message: "Quotation not found" }, { status: 404 });

  // Validate: status must be Draft
  if (existing.status !== "Draft") {
    return NextResponse.json({ success: false, message: "Only Draft quotations can be sent" }, { status: 400 });
  }

  // Validate: must have at least 1 line item
  if (existing.items.length === 0) {
    return NextResponse.json({ success: false, message: "Cannot send quotation without line items" }, { status: 400 });
  }

  // Validate: validity_date >= today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(existing.validUntil) < today) {
    return NextResponse.json({ success: false, message: "Validity date has passed — update before sending" }, { status: 400 });
  }

  // Check discount threshold (default 10%)
  const discountThreshold = 10;
  const hasApprovedApproval = existing.quotationApprovals.some(
    (a: any) => a.status === "Approved"
  );

  if (existing.discountPercent > discountThreshold && !hasApprovedApproval) {
    return NextResponse.json(
      { success: false, requires_approval: true, message: `Manager approval required before sending (discount ${existing.discountPercent}% > ${discountThreshold}% threshold)` },
      { status: 402 }
    );
  }

  try {
    const quotation = await prisma.$transaction(async (tx) => {
      // 1. Update quotation status
      const q = await tx.quotation.update({
        where: { id },
        data: { status: "Sent", sentAt: new Date() },
      });

      // 2. Insert quotation_status_history
      await tx.quotationStatusHistory.create({
        data: {
          quotationId: id,
          fromStatus: "Draft",
          toStatus: "Sent",
          changedById: user.id,
          notes: "Quotation sent to customer",
        },
      });

      // 3. Create follow-up (Call, scheduled +2 days)
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 2);

      await tx.followUp.create({
        data: {
          customerId: existing.customerId,
          type: "Call",
          nextMeetingDate: followUpDate,
          remarks: `Follow up on Quotation ${existing.quotationCode}`,
          status: "Pending",
          assignedUserId: user.id,
          companyId: user.companyId,
        },
      });

      // 4. Notification to creator
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Quotation Sent",
          message: `Quotation ${existing.quotationCode} sent successfully to ${existing.customer?.name || "customer"}`,
          type: "Quotation",
          link: `/quotations/${id}`,
        },
      });

      return q;
    });

    await logAudit(user.id, "Quotation", "Send", `Sent quotation ${existing.quotationCode}`, {
      resourceId: id,
      previousState: { status: "Draft" },
      newState: { status: "Sent" },
      context: extractAuditContext(request),
    });

    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Failed to send quotation: ${error.message}` },
      { status: 500 }
    );
  }
}
