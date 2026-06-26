import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// GET /api/accounts/[id]/visits
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth();
    if (!user || user.role === "Customer") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const [customerVisits, marketingVisits] = await Promise.all([
      prisma.customerVisit.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        include: { host: { select: { name: true } } },
      }),
      prisma.marketingVisit.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        include: { executive: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { customerVisits, marketingVisits },
      count: customerVisits.length + marketingVisits.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
