import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const expiredActive = await prisma.subscription.findMany({
      where: {
        status: "Active",
        endDate: { lt: now }
      }
    });

    if (expiredActive.length > 0) {
      const expiredIds = expiredActive.map(s => s.id);
      await prisma.subscription.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "Expired" }
      });

      // Log audit for each transitioned subscription
      for (const sub of expiredActive) {
        await logAudit(
          "system",
          "subscription",
          "update",
          `Subscription ${sub.id} (Plan: ${sub.planName}) for customer ${sub.customerId} transitioned to Expired automatically (EndDate: ${sub.endDate.toISOString()})`
        );
      }
    }

    return NextResponse.json({ success: true, processed: expiredActive.length });
  } catch (error) {
    console.error("Cron Subscriptions Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
