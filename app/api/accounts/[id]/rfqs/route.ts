import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// GET /api/accounts/[id]/rfqs
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

    const rfqs = await prisma.rFQ.findMany({
      where: { customerId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: rfqs,
      count: rfqs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
