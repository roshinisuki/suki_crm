import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit, extractAuditContext } from "@/lib/audit";

// POST /api/visits/[id]/checkout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const visit = await prisma.customerVisit.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    include: { customer: { select: { name: true } } },
  });

  if (!visit) return NextResponse.json({ success: false, message: "Visit not found" }, { status: 404 });

  if (visit.status !== "CHECKED_IN") {
    return NextResponse.json(
      { success: false, message: `Cannot check out — visit status is ${visit.status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.customerVisit.update({
    where: { id },
    data: {
      checkOutTime: new Date(),
      status: "CHECKED_OUT",
    },
    include: {
      customer: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
    },
  });

  await logAudit(user.id, "CustomerVisit", "CheckOut", `Checked out from visit to ${visit.customer?.name}`, {
    resourceId: id,
    newState: { status: "CHECKED_OUT" },
    context: extractAuditContext(request),
    severity: "INFO",
  });

  return NextResponse.json({ success: true, data: updated });
}
