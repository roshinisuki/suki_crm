import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit, extractAuditContext } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!["SalesManager", "Admin", "SuperAdmin"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Only Sales Managers and Admins can approve quotations" }, { status: 403 });
  }

  // SuperAdmin must use support mode to access client operational data
  if (user.role === "SuperAdmin" && (!user.supportMode || !user.companyId)) {
    return NextResponse.json({ success: false, message: "SuperAdmin must access business data via support/impersonation mode." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.decision || !["Approved", "Rejected"].includes(body.decision)) {
    return NextResponse.json({ success: false, message: "Decision must be 'Approved' or 'Rejected'" }, { status: 400 });
  }

  // Find the latest pending approval
  const approval = await prisma.quotationApproval.findFirst({
    where: { quotationId: id, status: "Pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!approval) {
    return NextResponse.json({ success: false, message: "No pending approval found" }, { status: 404 });
  }

  const existing = await prisma.quotation.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    select: { quotationCode: true, createdById: true },
  });
  if (!existing) return NextResponse.json({ success: false, message: "Quotation not found" }, { status: 404 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.quotationApproval.update({
        where: { id: approval.id },
        data: {
          status: body.decision,
          decidedAt: new Date(),
          notes: body.notes || approval.notes,
        },
      });

      // Notify creator
      await tx.notification.create({
        data: {
          userId: existing.createdById,
          title: body.decision === "Approved" ? "Quotation Approved" : "Quotation Approval Rejected",
          message:
            body.decision === "Approved"
              ? `Quotation ${existing.quotationCode} approved — you may now send`
              : `Quotation approval rejected: ${body.notes || "No notes provided"}`,
          type: "Approval",
          link: `/quotations/${id}`,
        },
      });

      return updated;
    });

    await logAudit(user.id, "Quotation", "ApprovalDecision", `${body.decision} quotation ${existing.quotationCode}`, {
      resourceId: id,
      newState: { approvalId: approval.id, decision: body.decision },
      context: extractAuditContext(request),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Failed to process approval: ${error.message}` },
      { status: 500 }
    );
  }
}
