"use server";

import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function getFollowUpsAction(params?: { status?: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role === "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    const statusFilter = params?.status;
    const isExecutive = userPayload.role === "MarketingExecutive";

    const followUps = await prisma.followUp.findMany({
      where: {
        ...(isExecutive ? { assignedUserId: userPayload.id } : {}),
        ...(statusFilter ? { status: statusFilter as any } : {}),
      },
      include: {
        customer:     { select: { id: true, name: true, customerCode: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { nextMeetingDate: "asc" },
    });

    const normalized = followUps.map((f) => ({
      ...f,
      scheduledTime: f.nextMeetingDate.toISOString(),
      nextMeetingDate: f.nextMeetingDate.toISOString(),
      notes:         f.remarks,
      userId:        f.assignedUserId,
      user:          f.assignedUser,
      createdAt:     f.createdAt.toISOString(),
      updatedAt:     f.updatedAt.toISOString(),
    }));

    return { success: true, data: normalized };
  } catch (error) {
    console.error("GET FollowUps Error:", error);
    return { success: false, message: "Failed to fetch follow-ups" };
  }
}

export async function createFollowUpAction(data: any) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) return { success: false, message: "Unauthorized" };

    const { customerId, scheduledTime, notes, remarks, assignedToId } = data;

    if (!customerId || !scheduledTime) {
      return { success: false, message: "Customer ID and Scheduled Time are required" };
    }

    const finalAssignedUserId = (userPayload.role === "Admin" && assignedToId) ? assignedToId : userPayload.id;

    const followUp = await prisma.followUp.create({
      data: {
        customerId,
        assignedUserId:  finalAssignedUserId,
        nextMeetingDate: new Date(scheduledTime),
        remarks:         notes || remarks || null,
        status:          "Pending",
      },
      include: {
        customer:     { select: { id: true, name: true, customerCode: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit(
      userPayload.id,
      "follow-up",
      "create",
      `Follow-up scheduled for customer ${customerId} on ${scheduledTime}`
    );

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      data: {
        ...followUp,
        scheduledTime: followUp.nextMeetingDate.toISOString(),
        notes:         followUp.remarks,
        userId:        followUp.assignedUserId,
        user:          followUp.assignedUser,
      }
    };
  } catch (error) {
    console.error("POST FollowUp Error:", error);
    return { success: false, message: "Failed to schedule follow-up" };
  }
}

export async function updateFollowUpStatusAction(data: { id: string; status: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) return { success: false, message: "Unauthorized" };

    const { id, status } = data;
    if (!id || !status) return { success: false, message: "ID and status are required" };

    const followUp = await prisma.followUp.update({
      where: { id },
      data:  { status: status as any },
    });

    await logAudit(userPayload.id, "follow-up", "update", `Follow-up ${id} marked as ${status}`);

    return { success: true, message: "Follow-up updated", data: { id: followUp.id } };
  } catch (error) {
    console.error("PUT FollowUp Error:", error);
    return { success: false, message: "Failed to update follow-up" };
  }
}

export async function completeFollowUpWithStatusAction(data: {
  id: string;
  customerStatus: string;
  remarks: string;
  nextMeetingDate?: string;
  nextMeetingNotes?: string;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload) return { success: false, message: "Unauthorized" };

    const { id, customerStatus, remarks, nextMeetingDate, nextMeetingNotes } = data;
    if (!id || !customerStatus || !remarks?.trim()) {
      return { success: false, message: "Follow-up ID, Customer Status, and Outcome Remarks are required." };
    }

    // 1. Fetch Follow-up details
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!followUp) return { success: false, message: "Follow-up record not found." };
    if (followUp.status === "Completed") return { success: false, message: "Follow-up has already been completed." };

    // 2. Update Customer Status & triggers
    let portalMsg = "";
    if (customerStatus === "APPROVED") {
      await prisma.customer.update({
        where: { id: followUp.customerId },
        data: { status: "APPROVED" }
      });
      // Try to activate customer portal link
      const { activateCustomerPortal } = await import("@/app/actions/auth");
      const emailRes = await activateCustomerPortal(followUp.customerId);
      if (emailRes.success) {
        portalMsg = " Portal activation link emailed.";
      }
    } else {
      await prisma.customer.update({
        where: { id: followUp.customerId },
        data: { status: customerStatus as any }
      });
    }

    // 3. Mark Follow-up as Completed and store notes
    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: {
        status: "Completed",
        completedAt: new Date(),
        notes: remarks.trim()
      }
    });

    // 4. Create another follow-up if requested
    if (nextMeetingDate) {
      await prisma.followUp.create({
        data: {
          customerId: followUp.customerId,
          assignedUserId: followUp.assignedUserId,
          nextMeetingDate: new Date(nextMeetingDate),
          remarks: nextMeetingNotes?.trim() || null,
          status: "Pending",
          visitId: followUp.visitId,
          visitType: followUp.visitType
        }
      });
    }

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard");
    revalidatePath("/follow-up");

    await logAudit(
      userPayload.id,
      "follow-up",
      "complete",
      `Follow-up ${id} completed. Customer status set to ${customerStatus}.${portalMsg}`
    );

    return { success: true, message: `Follow-up completed successfully.${portalMsg}`, data: { id: updatedFollowUp.id } };
  } catch (error) {
    console.error("Complete FollowUp Error:", error);
    return { success: false, message: "Failed to complete follow-up." };
  }
}
