import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const keyAccounts = await prisma.keyAccount.findMany({
    where: { companyId: user.companyId },
    include: {
      customer: {
        select: {
          id: true, name: true,
          customerVisits: {
            where: { status: "COMPLETED" },
            orderBy: { checkInTime: "desc" },
            take: 1,
            select: { checkInTime: true, outcomeType: true },
          },
          followUps: {
            where: { nextMeetingDate: { gte: new Date() }, status: "Pending" },
            orderBy: { nextMeetingDate: "asc" },
            take: 1,
            select: { nextMeetingDate: true },
          },
        },
      },
      accountManager: { select: { id: true, name: true } },
    },
  });

  const today = new Date();
  const data = keyAccounts
    .filter(ka => ka.customer.followUps.length > 0 || ka.customer.customerVisits.length > 0 || ka.nextReviewDate)
    .map(ka => ({
      id: ka.id,
      customerName: ka.customer.name,
      accountManager: ka.accountManager?.name || "—",
      nextReviewDate: ka.nextReviewDate,
      isOverdue: ka.nextReviewDate ? new Date(ka.nextReviewDate) < today : false,
      lastVisitDate: ka.customer.customerVisits[0]?.checkInTime || null,
      lastOutcome: ka.customer.customerVisits[0]?.outcomeType || "—",
      nextMeetingDate: ka.customer.followUps[0]?.nextMeetingDate || null,
    }));

  return NextResponse.json({ success: true, data });
}
