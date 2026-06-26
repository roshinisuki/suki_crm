import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notifications";
import { logAudit, extractAuditContext } from "@/lib/audit";

// GET: Role-restricted costing sheet view
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
      costingSheets: {
        include: { submittedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!rfq) return NextResponse.json({ success: false, message: "RFQ not found" }, { status: 404 });

  // Role-restricted view
  const canSeeFullBreakdown = ["CostingEngineer", "Admin", "SalesManager"].includes(user.role || "");

  if (canSeeFullBreakdown) {
    return NextResponse.json({ success: true, data: rfq.costingSheets });
  } else {
    // Sales Executive / Telecaller: only computed_unit_price
    const restricted = rfq.costingSheets.map((cs) => ({
      id: cs.id,
      rfqId: cs.rfqId,
      computedUnitPrice: cs.computedUnitPrice,
      createdAt: cs.createdAt,
      submittedBy: cs.submittedBy,
    }));
    return NextResponse.json({ success: true, data: restricted });
  }
}

// POST: Submit costing sheet (Costing Engineer / Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  // Role check: Costing Engineer or Admin only
  if (!["CostingEngineer", "Admin"].includes(user.role || "")) {
    return NextResponse.json(
      { success: false, message: "Only Costing Engineers and Admins can submit costing sheets" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const materialCost = parseFloat(body.material_cost);
  const labourCost = parseFloat(body.labour_cost);
  const overheadPercent = parseFloat(body.overhead_percent);
  const marginPercent = parseFloat(body.margin_percent);

  // Validate: all 4 values > 0
  if (!materialCost || materialCost <= 0) {
    return NextResponse.json({ success: false, message: "Material cost must be greater than 0" }, { status: 400 });
  }
  if (!labourCost || labourCost <= 0) {
    return NextResponse.json({ success: false, message: "Labour cost must be greater than 0" }, { status: 400 });
  }
  if (isNaN(overheadPercent) || overheadPercent < 0) {
    return NextResponse.json({ success: false, message: "Overhead percent must be 0 or greater" }, { status: 400 });
  }
  if (isNaN(marginPercent) || marginPercent < 0) {
    return NextResponse.json({ success: false, message: "Margin percent must be 0 or greater" }, { status: 400 });
  }

  // Server-compute: computed_unit_price = (material + labour) * (1 + overhead/100) * (1 + margin/100)
  const computedUnitPrice = (materialCost + labourCost) * (1 + overheadPercent / 100) * (1 + marginPercent / 100);

  if (computedUnitPrice <= 0) {
    return NextResponse.json({ success: false, message: "Computed unit price must be greater than 0" }, { status: 400 });
  }

  const rfq = await prisma.rFQ.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    select: { rfqCode: true, assignedUserId: true },
  });
  if (!rfq) return NextResponse.json({ success: false, message: "RFQ not found" }, { status: 404 });

  // INSERT (not UPDATE) — preserve costing history
  const costingSheet = await prisma.rFQCostingSheet.create({
    data: {
      rfqId: id,
      materialCost,
      labourCost,
      overheadPercent,
      marginPercent,
      computedUnitPrice,
      submittedById: user.id,
      notes: body.notes || null,
    },
  });

  // Notify assigned sales executive
  if (rfq.assignedUserId) {
    await dispatchNotification({
      userId: rfq.assignedUserId,
      title: "Costing Ready for RFQ",
      message: `Costing is ready for RFQ ${rfq.rfqCode}. Computed unit price: ₹${computedUnitPrice.toFixed(2)}`,
      type: "rfq",
      link: `/rfq/${id}`,
    });
  }

  await logAudit(user.id, "RFQ", "SubmitCosting", `Submitted costing for RFQ ${rfq.rfqCode} (Unit price: ₹${computedUnitPrice.toFixed(2)})`, {
    resourceId: id,
    newState: { materialCost, labourCost, overheadPercent, marginPercent, computedUnitPrice },
    context: extractAuditContext(request),
    severity: "INFO",
  });

  return NextResponse.json({ success: true, data: costingSheet }, { status: 201 });
}
