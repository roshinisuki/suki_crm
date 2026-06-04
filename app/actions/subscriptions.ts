"use server";

import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function getSubscriptionsAction(params?: { customerId?: string; status?: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) {
      return { success: false, message: "Unauthorized" };
    }

    const { customerId, status } = params || {};

    let rbacFilter = {};
    if (userPayload.role === "MarketingExecutive") {
      rbacFilter = { customer: { assignedUserId: userPayload.id } };
    } else if (userPayload.role === "Customer") {
      rbacFilter = { customer: { email: userPayload.email } };
    }

    // 1. Real-time transition of expired active subscriptions
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

      // Also log audit for each transitioned subscription
      for (const sub of expiredActive) {
        await logAudit(
          "system",
          "subscription",
          "update",
          `Subscription ${sub.id} (Plan: ${sub.planName}) for customer ${sub.customerId} transitioned to Expired automatically (EndDate: ${sub.endDate.toISOString()})`
        );
      }
    }

    // 2. Query with adapted filter status (since 'Expiring' is dynamic, query as Active)
    const expiringFilter = status === "Expiring";
    const statusQuery = expiringFilter ? "Active" : status;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        AND: [
          rbacFilter,
          customerId ? { customerId } : {},
          statusQuery ? { status: statusQuery as any } : {},
        ],
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = subscriptions.map((s) => {
      let finalStatus = s.status as string;
      
      if (s.status === "Active") {
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        if (s.endDate <= in30Days && s.endDate >= now) {
          finalStatus = "Expiring";
        }
      }

      return {
        ...s,
        status: finalStatus as any,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      };
    });

    const filteredData = expiringFilter
      ? serialized.filter(s => s.status === "Expiring")
      : serialized;

    return { success: true, data: filteredData };
  } catch (error) {
    console.error("GET Subscriptions Error:", error);
    return { success: false, message: "Failed to fetch subscriptions" };
  }
}

export async function createSubscriptionAction(data: any) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead", "MarketingExecutive"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { customerId, planName, startDate, endDate, status, notes } = data;

    if (!customerId || !planName || !startDate || !endDate) {
      return { success: false, message: "customerId, planName, startDate and endDate are required" };
    }

    const subscription = await prisma.subscription.create({
      data: {
        customerId,
        planName,
        startDate:  new Date(startDate),
        endDate:    new Date(endDate),
        status:     status || "Active",
        notes:      notes || null,
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
      },
    });

    // Automatically update customer status to Active if subscription is Active
    if (status === "Active" || !status) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { status: "Active" }
      });
    }

    await logAudit(
      userPayload.id,
      "subscription",
      "create",
      `Subscription created for customer ${customerId}: ${planName}`
    );

    return { success: true, message: "Subscription created successfully", data: subscription };
  } catch (error) {
    console.error("POST Subscription Error:", error);
    return { success: false, message: "Failed to create subscription" };
  }
}

export async function updateSubscriptionAction(id: string, data: any) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { planName, startDate, endDate, status, notes } = data;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        planName,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        notes,
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
      },
    });

    await logAudit(
      userPayload.id,
      "subscription",
      "update",
      `Subscription updated for customer ${subscription.customerId}: ${planName || 'status changed'}`
    );

    return { success: true, message: "Subscription updated successfully", data: subscription };
  } catch (error) {
    console.error("PUT Subscription Error:", error);
    return { success: false, message: "Failed to update subscription" };
  }
}

export async function renewSubscriptionAction(data: {
  oldSubscriptionId: string;
  planName: string;
  startDate: string;
  endDate: string;
  notes?: string;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead", "MarketingExecutive"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { oldSubscriptionId, planName, startDate, endDate, notes } = data;
    if (!oldSubscriptionId || !planName || !startDate || !endDate) {
      return { success: false, message: "All fields are required for renewal." };
    }

    // 1. Fetch old subscription details
    const oldSub = await prisma.subscription.findUnique({
      where: { id: oldSubscriptionId }
    });

    if (!oldSub) {
      return { success: false, message: "Original subscription plan not found." };
    }

    // 2. Mark the old subscription as Renewed
    await prisma.subscription.update({
      where: { id: oldSubscriptionId },
      data: { status: "Renewed" }
    });

    // 3. Create the new active subscription
    const newSub = await prisma.subscription.create({
      data: {
        customerId: oldSub.customerId,
        planName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "Active",
        notes: notes || `Renewed from plan ${oldSub.planName} (${oldSub.id}).`,
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } }
      }
    });

    // 4. Force Customer Status to Active
    await prisma.customer.update({
      where: { id: oldSub.customerId },
      data: { status: "Active" }
    });

    await logAudit(
      userPayload.id,
      "subscription",
      "renew",
      `Subscription ${oldSubscriptionId} renewed. Created new plan ${newSub.id} (${planName}) for customer ${oldSub.customerId}`
    );

    return {
      success: true,
      message: "Subscription renewed successfully",
      data: {
        ...newSub,
        createdAt: newSub.createdAt.toISOString(),
        updatedAt: newSub.updatedAt.toISOString(),
        startDate: newSub.startDate.toISOString(),
        endDate: newSub.endDate.toISOString(),
      }
    };
  } catch (error) {
    console.error("RENEW Subscription Error:", error);
    return { success: false, message: "Failed to renew subscription" };
  }
}
