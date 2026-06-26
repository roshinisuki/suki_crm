import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit, extractAuditContext } from "@/lib/audit";

// POST /api/visits/[id]/checkin
// Body: { gps_lat, gps_lng }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (user.role === "Customer") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { gps_lat, gps_lng } = body;

  if (gps_lat == null || gps_lng == null) {
    return NextResponse.json({ success: false, message: "gps_lat and gps_lng are required" }, { status: 400 });
  }

  const visit = await prisma.customerVisit.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    include: { plantLocation: true, customer: { select: { name: true } } },
  });

  if (!visit) return NextResponse.json({ success: false, message: "Visit not found" }, { status: 404 });

  // Validate visit status = PLANNED
  if (visit.status !== "PLANNED") {
    return NextResponse.json(
      { success: false, message: `Cannot check in — visit status is ${visit.status}` },
      { status: 400 }
    );
  }

  // Validate planned_date is today (cannot check in early by > 1 day)
  if (visit.plannedDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedDay = new Date(visit.plannedDate);
    plannedDay.setHours(0, 0, 0, 0);
    const diffDays = (plannedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 1) {
      return NextResponse.json(
        { success: false, message: "Cannot check in more than 1 day before the planned date" },
        { status: 400 }
      );
    }
  }

  // Calculate distance from plant location if coordinates exist
  let warning: string | null = null;
  let gpsAnomaly = false;
  if (visit.plantLocation?.gpsLat && visit.plantLocation?.gpsLng) {
    const distance = haversineDistance(gps_lat, gps_lng, visit.plantLocation.gpsLat, visit.plantLocation.gpsLng);
    if (distance > 1) {
      warning = `Check-in location is ${distance.toFixed(2)} km from registered plant address`;
      gpsAnomaly = true;
    }
  }

  const updated = await prisma.customerVisit.update({
    where: { id },
    data: {
      checkInTime: new Date(),
      gpsLat: parseFloat(gps_lat),
      gpsLng: parseFloat(gps_lng),
      gpsAnomaly,
      status: "CHECKED_IN",
    },
    include: {
      customer: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      plantLocation: { select: { id: true, locationName: true } },
    },
  });

  await logAudit(user.id, "CustomerVisit", "CheckIn", `Checked in for visit to ${visit.customer?.name}`, {
    resourceId: id,
    newState: { status: "CHECKED_IN", gps_lat, gps_lng, gpsAnomaly },
    context: extractAuditContext(request),
    severity: "INFO",
  });

  return NextResponse.json({
    success: true,
    data: updated,
    ...(warning ? { warning } : {}),
  });
}

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
