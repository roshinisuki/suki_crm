import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    let virtualNotifications: any[] = [];
    const isExecutive = userPayload.role === "MarketingExecutive";

    // 1. Pending Subscriptions Virtual Notifications
    if (userPayload.role === "Admin" || userPayload.role === "MarketingLead") {
      const pendingCustomers = await prisma.customer.findMany({
        where: { status: "APPROVED" },
        orderBy: { updatedAt: "desc" }
      });
      virtualNotifications = pendingCustomers.map(c => ({
        id: `virtual-pending-sub-${c.id}`,
        userId: userPayload.id,
        title: "Approved Customer Pending Subscription",
        message: `${c.name} (${c.customerCode || ""}) is approved but does not have an active subscription plan. Add a subscription to activate their account and enable customer portal access.`,
        type: "system",
        isRead: false,
        createdAt: c.updatedAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }));
    }

    // 2. Active Checked-in Inbound Customer Visits (Visits In-Progress)
    const activeInbounds = await prisma.customerVisit.findMany({
      where: {
        status: "CHECKED_IN",
        hostedBy: isExecutive ? userPayload.id : undefined
      },
      include: {
        customer: { select: { name: true } },
        host: { select: { name: true } }
      }
    });

    const inboundNotifs = activeInbounds.map(v => ({
      id: `virtual-inbound-visit-${v.id}`,
      userId: userPayload.id,
      title: "Inbound Visitor Checked In",
      message: `${v.customer?.name || "Visitor"} arrived for a ${v.purpose || "visit"}. Hosted by ${v.host?.name || "you"}.`,
      type: "system",
      isRead: false,
      createdAt: v.checkInTime ? v.checkInTime.toISOString() : new Date().toISOString(),
      updatedAt: v.checkInTime ? v.checkInTime.toISOString() : new Date().toISOString()
    }));

    // 3. Active Checked-in Outbound Marketing Visits (Visits In-Progress)
    const activeOutbounds = await prisma.marketingVisit.findMany({
      where: {
        status: "CHECKED_IN",
        executiveId: isExecutive ? userPayload.id : undefined
      },
      include: {
        customer: { select: { name: true } }
      }
    });

    const outboundNotifs = activeOutbounds.map(v => ({
      id: `virtual-outbound-visit-${v.id}`,
      userId: userPayload.id,
      title: "Outbound Field Onsite Check-In",
      message: `${v.customer?.name || "Customer"} field meeting in progress for ${v.purpose || "visit"}.`,
      type: "system",
      isRead: false,
      createdAt: v.checkIn ? v.checkIn.toISOString() : new Date().toISOString(),
      updatedAt: v.checkIn ? v.checkIn.toISOString() : new Date().toISOString()
    }));

    const notifications = await prisma.notification.findMany({
      where: { userId: userPayload.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const combined = [...virtualNotifications, ...inboundNotifs, ...outboundNotifs, ...notifications];

    return NextResponse.json({ success: true, data: combined });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: userPayload.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: "All marked as read" });
  } catch (error) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to mark as read" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    await prisma.notification.deleteMany({
      where: { userId: userPayload.id }
    });

    return NextResponse.json({ success: true, message: "All notifications cleared successfully" });
  } catch (error) {
    console.error("Notifications DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to clear notifications" }, { status: 500 });
  }
}
