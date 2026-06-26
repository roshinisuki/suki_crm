import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit, extractAuditContext } from "@/lib/audit";

// POST /api/visits/[id]/complete
// Body: { visit_summary, next_action, create_followup, followup_type, followup_datetime }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { visit_summary, next_action, create_followup, followup_type, followup_datetime } = body;

  // Require visit_summary
  if (!visit_summary || !visit_summary.trim()) {
    return NextResponse.json(
      { success: false, message: "visit_summary is required to complete a visit" },
      { status: 400 }
    );
  }

  const visit = await prisma.customerVisit.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    include: { customer: { select: { name: true } } },
  });

  if (!visit) return NextResponse.json({ success: false, message: "Visit not found" }, { status: 404 });

  if (visit.status !== "CHECKED_IN" && visit.status !== "CHECKED_OUT") {
    return NextResponse.json(
      { success: false, message: `Cannot complete — visit must be checked in first (current: ${visit.status})` },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.customerVisit.update({
      where: { id },
      data: {
        status: "COMPLETED",
        visitSummary: visit_summary,
        nextAction: next_action || null,
        ...(visit.status === "CHECKED_IN" ? { checkOutTime: new Date() } : {}),
      },
    });

    // Create follow-up if requested
    if (create_followup && followup_datetime) {
      await tx.followUp.create({
        data: {
          customerId: visit.customerId,
          assignedUserId: visit.hostedBy,
          nextMeetingDate: new Date(followup_datetime),
          dueDate: new Date(followup_datetime),
          remarks: followup_type || "Visit follow-up",
          status: "Pending",
          priority: "Medium",
          sourceType: "VISIT_COMPLETE",
          sourceId: visit.id,
          autoCreated: true,
          companyId: visit.companyId,
        },
      });
    }

    return updated;
  });

  await logAudit(user.id, "CustomerVisit", "Complete", `Completed visit to ${visit.customer?.name}`, {
    resourceId: id,
    newState: { status: "COMPLETED", visitSummary: visit_summary },
    context: extractAuditContext(request),
    severity: "WARN",
  });

  return NextResponse.json({ success: true, data: result, message: "Visit completed" });
}
