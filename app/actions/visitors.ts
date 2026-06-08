"use server";

import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { dispatchNotificationsToMany } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function getVisitorsAction() {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead", "MarketingExecutive"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const visitors = await prisma.visitor.findMany({
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: { inTime: "desc" },
    });

    const normalized = visitors.map((v) => ({
      ...v,
      name:         v.visitorName,
      email:        v.visitorEmail,
      phone:        v.visitorPhone,
      hostName:     v.host?.name ?? null,
      checkInTime:  v.inTime.toISOString(),
      checkOutTime: v.outTime?.toISOString() ?? null,
      inTime:       v.inTime.toISOString(),
      outTime:      v.outTime?.toISOString() ?? null,
      createdAt:    v.createdAt.toISOString(),
      updatedAt:    v.updatedAt.toISOString(),
    }));

    return { success: true, data: normalized };
  } catch (error) {
    console.error("GET Visitors Error:", error);
    return { success: false, message: "Failed to fetch visitors" };
  }
}

export async function createVisitorAction(data: any) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead", "MarketingExecutive"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { name, email, phone, company, purpose, hostName } = data;

    if (!name || !phone || !purpose) {
      return { success: false, message: "Name, Phone, and Purpose are required" };
    }

    const visitor = await prisma.visitor.create({
      data: {
        visitorName:  name,
        visitorEmail: email || null,
        visitorPhone: phone,
        company:      company || "",
        purpose,
        hostUserId:   userPayload.id,
        inTime:       new Date(),
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit(
      userPayload.id,
      "visitor",
      "create",
      `Walk-in registered: ${name} visited ${visitor.host?.name ?? "office"}`
    );

    // Notify Admin and Leads about the walk-in
    const adminsAndLeads = await prisma.user.findMany({
      where: { isActive: true, role: { in: ["Admin", "MarketingLead"] } }
    });
    
    if (adminsAndLeads.length > 0) {
      await dispatchNotificationsToMany({
        userIds: adminsAndLeads.map(u => u.id),
        title: "New Visitor Walk-in",
        message: `${name} from ${company || "unknown"} checked in to meet ${visitor.host?.name ?? "someone"}`,
        type: "visit",
        link: "/visitor-management"
      });
    }

    return {
      success: true,
      message: "Visitor registered successfully",
      data: {
        ...visitor,
        name:         visitor.visitorName,
        email:        visitor.visitorEmail,
        phone:        visitor.visitorPhone,
        hostName:     visitor.host?.name ?? null,
        checkInTime:  visitor.inTime.toISOString(),
        checkOutTime: null,
      }
    };
  } catch (error) {
    console.error("POST Visitor Error:", error);
    return { success: false, message: "Failed to create visitor" };
  }
}

export async function checkoutVisitorAction(data: any) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead", "MarketingExecutive"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { id } = data;
    if (!id) return { success: false, message: "Visitor ID is required" };

    const visitor = await prisma.visitor.update({
      where: { id },
      data:  { outTime: new Date() },
    });

    await logAudit(userPayload.id, "visitor", "checkout", `Visitor ${visitor.visitorName} checked out`);

    return {
      success: true,
      message: "Visitor checked out",
      data: { ...visitor, checkOutTime: visitor.outTime?.toISOString() ?? null }
    };
  } catch (error) {
    console.error("Checkout Visitor Error:", error);
    return { success: false, message: "Failed to checkout visitor" };
  }
}

export async function deleteVisitorAction(id: string) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role !== "Admin") {
      return { success: false, message: "Unauthorized: Only Admins can delete visitors" };
    }

    if (!id) return { success: false, message: "Visitor ID is required" };

    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) return { success: false, message: "Visitor not found" };

    await prisma.visitor.delete({ where: { id } });

    await logAudit(
      userPayload.id,
      "visitor",
      "delete",
      `Visitor record deleted: ${visitor.visitorName}`
    );

    return { success: true, message: "Visitor deleted successfully" };
  } catch (error) {
    console.error("Delete Visitor Error:", error);
    return { success: false, message: "Failed to delete visitor" };
  }
}

export async function getUnifiedOfficeVisitsAction() {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead", "MarketingExecutive"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = userPayload.id;
    const isExecutive = userPayload.role === "MarketingExecutive";

    // 1. Fetch general walk-in guests
    const guests = await prisma.visitor.findMany({
      where: isExecutive ? { hostUserId: userId } : {},
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: { inTime: "desc" },
    });

    // 2. Fetch CRM customer inbound visits
    const customerVisits = await prisma.customerVisit.findMany({
      where: isExecutive ? { hostedBy: userId } : {},
      include: {
        customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        host: { select: { id: true, name: true } },
      },
      orderBy: { checkInTime: "desc" },
    });

    // 2b. Fetch FollowUps for these visits
    const followUps = await prisma.followUp.findMany({
      where: {
        visitId: { in: customerVisits.map(cv => cv.id) },
        visitType: "INBOUND"
      }
    });
    const followUpMap = new Map(followUps.map(f => [f.visitId, f.status]));

    // 3. Normalize guests
    const normalizedGuests = guests.map((g) => ({
      id: g.id,
      type: "Guest" as const,
      name: g.visitorName,
      contact: g.visitorPhone,
      email: g.visitorEmail || null,
      company: g.company || "",
      purpose: g.purpose,
      hostName: g.host?.name || "Unknown",
      hostId: g.hostUserId,
      checkInTime: g.inTime.toISOString(),
      checkOutTime: g.outTime ? g.outTime.toISOString() : null,
      status: g.outTime ? "CHECKED_OUT" : "CHECKED_IN",
      outcome: "Walk-in Guest",
      customerDecision: null,
      rejectionReason: null,
    }));

    // 4. Normalize customer visits
    const normalizedCustomers = customerVisits.map((cv) => ({
      id: cv.id,
      type: "Customer" as const,
      name: cv.customer?.name || "Unknown Customer",
      contact: cv.customer?.phone || "—",
      email: null,
      company: "",
      purpose: cv.purpose,
      hostName: cv.host?.name || "Unknown Host",
      hostId: cv.hostedBy,
      checkInTime: cv.checkInTime.toISOString(),
      checkOutTime: cv.checkOutTime ? cv.checkOutTime.toISOString() : null,
      status: cv.status, // "CHECKED_IN" | "CHECKED_OUT"
      outcome: cv.outcome || "Pending Checkout",
      customerDecision: cv.customerDecision || "Pending Decision",
      rejectionReason: cv.rejectionReason || null,
      customerCode: cv.customer?.customerCode || "—",
      customerId: cv.customerId,
      followUpStatus: followUpMap.get(cv.id) || null,
    }));

    // 5. Combine and sort
    const combined = [...normalizedGuests, ...normalizedCustomers].sort(
      (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );

    return { success: true, data: combined };
  } catch (error) {
    console.error("GET Unified Office Visits Error:", error);
    return { success: false, message: "Failed to fetch office visits logs" };
  }
}
