import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");
  const hostedBy = searchParams.get("hostedBy");
  const customerId = searchParams.get("customerId");
  const isExport = searchParams.get("export") === "true";

  const where: any = {
    deletedAt: null,
    companyId: user.companyId,
  };
  if (status && status !== "All") {
    if (status === "Planned") where.status = "PLANNED";
    else if (status === "Checked In") where.status = "CHECKED_IN";
    else if (status === "Checked Out") where.status = "CHECKED_OUT";
    else if (status === "Completed") where.status = "COMPLETED";
    else if (status === "Missed") where.status = "MISSED";
    else if (status === "Unavailable") where.status = "CUSTOMER_UNAVAILABLE";
  }
  if (hostedBy) where.hostedBy = hostedBy;
  if (customerId) where.customerId = customerId;

  // Date range filter
  if (startDate || endDate) {
    where.OR = [
      { checkInTime: {} as any },
      { createdAt: {} as any },
    ];
    if (startDate && endDate) {
      where.OR = [
        { checkInTime: { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59") } },
        { createdAt: { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59") } },
      ];
    } else if (startDate) {
      where.OR = [
        { checkInTime: { gte: new Date(startDate) } },
        { createdAt: { gte: new Date(startDate) } },
      ];
    } else if (endDate) {
      where.OR = [
        { checkInTime: { lte: new Date(endDate + "T23:59:59") } },
        { createdAt: { lte: new Date(endDate + "T23:59:59") } },
      ];
    }
  }

  if (user.role === "SalesExecutive") where.hostedBy = user.id;

  const visits = await prisma.customerVisit.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, customerCode: true } },
      host: { select: { id: true, name: true } },
    },
    orderBy: { checkInTime: "desc" },
    ...(isExport ? {} : { take: 100 }),
  });

  // Summary
  const total = visits.length;
  const completed = visits.filter((v) => v.status === "COMPLETED").length;
  const missed = visits.filter((v) => v.status === "MISSED").length;
  const planned = visits.filter((v) => v.status === "PLANNED").length;
  const checkedIn = visits.filter((v) => v.status === "CHECKED_IN").length;
  const checkedOut = visits.filter((v) => v.status === "CHECKED_OUT").length;
  const unavailable = visits.filter((v) => v.status === "CUSTOMER_UNAVAILABLE").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  const avgDuration = total > 0
    ? Math.round(visits.reduce((sum, v) => sum + (v.durationMinutes || 0), 0) / total)
    : 0;

  // Key account compliance: key accounts with a visit in the period
  const keyAccounts = await prisma.customer.findMany({
    where: { companyId: user.companyId, deletedAt: null, isKeyAccountV2: true },
    select: { id: true },
  });
  const keyAccountIds = keyAccounts.map((k) => k.id);
  const keyAccountsVisited = new Set(visits.filter((v) => v.status === "COMPLETED" && keyAccountIds.includes(v.customerId)).map((v) => v.customerId));
  const keyAccountComplianceRate = keyAccountIds.length > 0 ? Math.round((keyAccountsVisited.size / keyAccountIds.length) * 1000) / 10 : 0;

  const formattedVisits = visits.map((v) => {
    return {
      id: v.id,
      customerName: v.customer?.name || "—",
      customerCode: v.customer?.customerCode || "—",
      plantLocation: v.plantLocationId || "—",
      purpose: v.purpose || "—",
      plannedDate: v.plannedDate ? new Date(v.plannedDate).toISOString() : v.checkInTime ? new Date(v.checkInTime).toISOString() : null,
      status: v.status,
      visitSummaryPreview: v.meetingSummary ? v.meetingSummary.substring(0, 80) : v.visitSummary ? v.visitSummary.substring(0, 80) : "",
      hostName: v.host?.name || "—",
      checkInTime: v.checkInTime ? new Date(v.checkInTime).toISOString() : null,
      checkOutTime: v.checkOutTime ? new Date(v.checkOutTime).toISOString() : null,
      duration: v.durationMinutes ?? null,
      outcome: v.outcomeType || v.outcome || null,
    };
  });

  return NextResponse.json({
    success: true,
    summary: { total, planned, checkedIn, checkedOut, completed, missed, unavailable, completionRate, avgDuration, keyAccountComplianceRate },
    visits: formattedVisits,
  });
}
