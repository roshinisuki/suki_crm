import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Aggregated win/loss stats scoped to the user's company.
export async function GET(request: NextRequest) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const dateFilter: any = {};
  if (fromStr || toStr) {
    dateFilter.updatedAt = {};
    if (fromStr) dateFilter.updatedAt.gte = new Date(fromStr);
    if (toStr) dateFilter.updatedAt.lte = new Date(toStr);
  }

  // Win = deals with status "Won"; Lost = deals with status "Lost"
  const baseWhere = { companyId: user.companyId, ...dateFilter };

  const [wonCount, lostCount, wonValue, lostValue, lostAnalyses, competitorAgg, reasonAgg] = await Promise.all([
    prisma.deal.count({ where: { ...baseWhere, status: "Won" } }),
    prisma.deal.count({ where: { ...baseWhere, status: "Lost" } }),
    prisma.deal.aggregate({ where: { ...baseWhere, status: "Won" }, _sum: { dealValue: true } }),
    prisma.deal.aggregate({ where: { ...baseWhere, status: "Lost" }, _sum: { dealValue: true } }),
    prisma.lostDealAnalysis.findMany({
      where: { companyId: user.companyId, ...(dateFilter.updatedAt ? { createdAt: dateFilter.updatedAt } : {}) },
      select: { competitorId: true, lossReasonId: true, competitorWonPrice: true, ourFinalPrice: true },
    }),
    prisma.lostDealAnalysis.groupBy({
      by: ["competitorId"],
      where: { companyId: user.companyId, competitorId: { not: null }, ...(dateFilter.updatedAt ? { createdAt: dateFilter.updatedAt } : {}) },
      _count: { _all: true },
    }),
    prisma.lostDealAnalysis.groupBy({
      by: ["lossReasonId"],
      where: { companyId: user.companyId, lossReasonId: { not: null }, ...(dateFilter.updatedAt ? { createdAt: dateFilter.updatedAt } : {}) },
      _count: { _all: true },
    }),
  ]);

  // Hydrate competitor + loss reason names
  const competitorIds = competitorAgg.map((c) => c.competitorId).filter(Boolean) as string[];
  const reasonIds = reasonAgg.map((r) => r.lossReasonId).filter(Boolean) as string[];

  const [competitors, reasons] = await Promise.all([
    competitorIds.length ? prisma.competitor.findMany({ where: { id: { in: competitorIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
    reasonIds.length ? prisma.lossReason.findMany({ where: { id: { in: reasonIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  const competitorMap = new Map(competitors.map((c) => [c.id, c.name]));
  const reasonMap = new Map(reasons.map((r) => [r.id, r.name]));

  const byCompetitor = competitorAgg.map((c) => ({
    competitorId: c.competitorId,
    competitorName: competitorMap.get(c.competitorId!) || "Unknown",
    lostCount: c._count._all,
  }));

  const byLossReason = reasonAgg.map((r) => ({
    lossReasonId: r.lossReasonId,
    lossReasonName: reasonMap.get(r.lossReasonId!) || "Unknown",
    lostCount: r._count._all,
  }));

  const total = wonCount + lostCount;
  const winRate = total > 0 ? Math.round((wonCount / total) * 1000) / 10 : 0;

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        wonCount,
        lostCount,
        wonValue: wonValue._sum.dealValue || 0,
        lostValue: lostValue._sum.dealValue || 0,
        winRate,
        total,
      },
      byCompetitor,
      byLossReason,
      analyses: lostAnalyses,
    },
  });
}
