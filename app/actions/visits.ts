"use server";

import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { activateCustomerPortal } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

/** Helper: checks if user has permission for a specific customer */
async function validateCustomerAccess(customerId: string, userId: string, role: string) {
  // Requirement: Remove authorized customer rule for employees
  return true;
}

// ═══════════════════════════════════════════════════════════════
// 1. DASHBOARD DATA LOADER
// ═══════════════════════════════════════════════════════════════
export async function getDashboardDataAction() {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role === "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    const userId = userPayload.id;
    const isExecutive = userPayload.role === "MarketingExecutive";

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOf7Days = new Date();
    startOf7Days.setHours(0, 0, 0, 0);
    const endOf7Days = new Date();
    endOf7Days.setDate(endOf7Days.getDate() + 7);
    endOf7Days.setHours(23, 59, 59, 999);

    // 1. Today's Inbound Visits
    const inboundVisits = await prisma.customerVisit.findMany({
      where: {
        AND: [
          isExecutive ? { hostedBy: userId } : {},
          {
            OR: [
              { status: "CHECKED_IN" },
              { checkInTime: { gte: startOfToday, lte: endOfToday } }
            ]
          }
        ]
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        host: { select: { id: true, name: true } }
      },
      orderBy: { checkInTime: "desc" }
    });

    // 2. Today's Outbound Visits
    const outboundVisits = await prisma.marketingVisit.findMany({
      where: {
        AND: [
          isExecutive ? { executiveId: userId } : {},
          {
            OR: [
              { status: "CHECKED_IN" },
              { checkIn: { gte: startOfToday, lte: endOfToday } }
            ]
          }
        ]
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        executive: { select: { id: true, name: true } }
      },
      orderBy: { checkIn: "desc" }
    });

    // 3. Upcoming Follow-ups (Next 7 Days)
    const upcomingFollowUps = await prisma.followUp.findMany({
      where: {
        assignedUserId: isExecutive ? userId : undefined,
        nextMeetingDate: { gte: startOf7Days, lte: endOf7Days },
        status: "Pending"
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } }
      },
      orderBy: { nextMeetingDate: "asc" }
    });

    // 4. Overdue Follow-ups — exclude completed/cancelled ones
    const overdueFollowUps = await prisma.followUp.findMany({
      where: {
        assignedUserId: isExecutive ? userId : undefined,
        nextMeetingDate: { lt: startOfToday },
        status: { in: ["Pending", "Overdue"] },
        NOT: { status: "Completed" }
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } }
      },
      orderBy: { nextMeetingDate: "asc" }
    });

    // 5. Pending Visit Approvals (visits flagged as requiresApproval and not yet approved)
    const pendingInboundApprovals = await prisma.customerVisit.findMany({
      where: {
        approvalStatus: "PENDING_APPROVAL",
        hostedBy: isExecutive ? userId : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        host: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const pendingOutboundApprovals = await prisma.marketingVisit.findMany({
      where: {
        approvalStatus: "PENDING_APPROVAL",
        executiveId: isExecutive ? userId : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        executive: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const pendingApprovals = [
      ...pendingInboundApprovals.map(v => ({
        id: v.id,
        visitType: "Inbound" as const,
        customerName: v.customer.name,
        customerCode: v.customer.customerCode,
        customerId: v.customerId,
        purpose: v.purpose,
        submittedBy: v.host.name,
        submittedById: v.hostedBy,
        priority: v.priority,
        checkInTime: v.checkInTime.toISOString(),
        createdAt: v.createdAt.toISOString(),
      })),
      ...pendingOutboundApprovals.map(v => ({
        id: v.id,
        visitType: "Outbound" as const,
        customerName: v.customer.name,
        customerCode: v.customer.customerCode,
        customerId: v.customerId,
        purpose: v.purpose || "Field Visit",
        submittedBy: v.executive.name,
        submittedById: v.executiveId,
        priority: "Normal",
        checkInTime: v.checkIn.toISOString(),
        createdAt: v.createdAt.toISOString(),
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Compute Engagement Metrics (for the top mock banner)
    // Counts for this billing month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalCustomers = await prisma.customer.count({
      where: isExecutive ? { assignedUserId: userId } : {}
    });

    const activeSubs = await prisma.subscription.count({
      where: {
        status: "Active",
        customer: isExecutive ? { assignedUserId: userId } : {}
      }
    });

    const monthlyVisits = await prisma.marketingVisit.count({
      where: {
        checkIn: { gte: startOfMonth },
        executiveId: isExecutive ? userId : undefined
      }
    }) + await prisma.customerVisit.count({
      where: {
        checkInTime: { gte: startOfMonth },
        hostedBy: isExecutive ? userId : undefined
      }
    });

    // 5. Inbound Walk-Ins (Checked-In today, not checked out)
    const inboundWalkIns = await prisma.visitor.count({
      where: {
        AND: [
          isExecutive ? { hostUserId: userId } : {},
          { inTime: { gte: startOfToday, lte: endOfToday } },
          { outTime: null }
        ]
      }
    });

    // 6. Outbound Walk-Ins (Checked-out today)
    const outboundWalkIns = await prisma.visitor.count({
      where: {
        AND: [
          isExecutive ? { hostUserId: userId } : {},
          { inTime: { gte: startOfToday, lte: endOfToday } },
          { outTime: { not: null } }
        ]
      }
    });

    const teamCount = await prisma.user.count({
      where: { isActive: true, role: { in: ["MarketingExecutive", "MarketingLead"] } }
    });

    const visitsToday = await prisma.marketingVisit.count({
      where: {
        checkIn: { gte: startOfToday, lte: endOfToday },
        executiveId: isExecutive ? userId : undefined
      }
    }) + await prisma.customerVisit.count({
      where: {
        checkInTime: { gte: startOfToday, lte: endOfToday },
        hostedBy: isExecutive ? userId : undefined
      }
    });

    const approvedCount = await prisma.customer.count({
      where: {
        status: "APPROVED",
        assignedUserId: isExecutive ? userId : undefined
      }
    });

    const rejectedCount = await prisma.customer.count({
      where: {
        status: "REJECTED",
        assignedUserId: isExecutive ? userId : undefined
      }
    });

    const pendingCount = await prisma.customer.count({
      where: {
        status: "PENDING",
        assignedUserId: isExecutive ? userId : undefined
      }
    });

    const conversionRate = totalCustomers > 0 
      ? Math.round((approvedCount / totalCustomers) * 100)
      : 0;

    // Subscription metrics for dashboard concentric ring chart
    const totalPlans = await prisma.subscription.count({
      where: isExecutive ? { customer: { assignedUserId: userId } } : {}
    });

    const pendingPlans = await prisma.subscription.count({
      where: {
        status: "Pending",
        customer: isExecutive ? { assignedUserId: userId } : {}
      }
    });

    const expiredPlans = await prisma.subscription.count({
      where: {
        status: "Expired",
        customer: isExecutive ? { assignedUserId: userId } : {}
      }
    });

    // Calculate customer growth over the last 6 months
    const allCustomersObj = await prisma.customer.findMany({
      where: isExecutive ? { assignedUserId: userId } : {},
      select: { createdAt: true }
    });

    const monthlyCounts: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const todayDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      monthlyCounts[label] = 0;
    }

    allCustomersObj.forEach(c => {
      const d = new Date(c.createdAt);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (monthlyCounts[label] !== undefined) {
        monthlyCounts[label]++;
      }
    });

    const monthlyGrowth = Object.entries(monthlyCounts).map(([month, count]) => ({ month, count }));

    // Calculate Marketing Visit Activity over the last 6 months
    const marketingVisits = await prisma.marketingVisit.findMany({
      where: {
        checkIn: { gte: new Date(todayDate.getFullYear(), todayDate.getMonth() - 5, 1) },
        executiveId: isExecutive ? userId : undefined
      },
      select: { checkIn: true }
    });

    const customerVisits = await prisma.customerVisit.findMany({
      where: {
        checkInTime: { gte: new Date(todayDate.getFullYear(), todayDate.getMonth() - 5, 1) },
        hostedBy: isExecutive ? userId : undefined
      },
      select: { checkInTime: true }
    });

    const visitCounts: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      visitCounts[label] = 0;
    }

    marketingVisits.forEach(v => {
      const d = new Date(v.checkIn);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (visitCounts[label] !== undefined) {
        visitCounts[label]++;
      }
    });

    customerVisits.forEach(v => {
      const d = new Date(v.checkInTime);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (visitCounts[label] !== undefined) {
        visitCounts[label]++;
      }
    });

    const monthlyVisitActivity = Object.entries(visitCounts).map(([month, count]) => ({ month, count }));


    const serializeVisit = (v: any) => ({
      ...v,
      checkInTime: v.checkInTime ? v.checkInTime.toISOString() : null,
      checkOutTime: v.checkOutTime ? v.checkOutTime.toISOString() : null,
      checkIn: v.checkIn ? v.checkIn.toISOString() : null,
      checkOut: v.checkOut ? v.checkOut.toISOString() : null,
      createdAt: v.createdAt ? v.createdAt.toISOString() : null,
      updatedAt: v.updatedAt ? v.updatedAt.toISOString() : null,
      nextMeetingDate: v.nextMeetingDate ? v.nextMeetingDate.toISOString() : null,
    });

    const serializeFollowUp = (f: any) => ({
      ...f,
      nextMeetingDate: f.nextMeetingDate ? f.nextMeetingDate.toISOString() : null,
      createdAt: f.createdAt ? f.createdAt.toISOString() : null,
      updatedAt: f.updatedAt ? f.updatedAt.toISOString() : null,
    });

    const serializeCustomer = (c: any) => ({
      ...c,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
    });

    return {
      success: true,
      data: {
        inboundVisits: inboundVisits.map(serializeVisit),
        outboundVisits: outboundVisits.map(serializeVisit),
        upcomingFollowUps: upcomingFollowUps.map(serializeFollowUp),
        overdueFollowUps: overdueFollowUps.map(serializeFollowUp),
        pendingApprovals: pendingApprovals,
        stats: {
          activeEngagement: conversionRate || 0,
          monthlyVisits: monthlyVisits || 0,
          activeSubs: activeSubs || 0,
          teamCount: teamCount || 0,
          totalCustomers: totalCustomers || 0,
          visitsToday: visitsToday || 0,
          inboundWalkIns,
          outboundWalkIns,
          approvedCount,
          rejectedCount,
          pendingCount,
          totalPlans,
          pendingPlans,
          expiredPlans,
          monthlyGrowth: monthlyGrowth || [],
          monthlyVisitActivity: monthlyVisitActivity || []
        }
      }
    };
  } catch (error) {
    console.error("Dashboard Data Action Error:", error);
    return { success: false, message: "Failed to load dashboard statistics" };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. INBOUND WORKFLOWS (Customer Visits Suki Office)
// ═══════════════════════════════════════════════════════════════
export async function checkInInboundAction(data: {
  customerId: string;
  purpose: string;
  notes?: string;
  // Extended Office Visit fields
  priority?: string;
  meetingType?: string;
  source?: string;
  agenda?: string;
  expectedDuration?: number;
  department?: string;
  requiresApproval?: boolean;
  visitMetadata?: Record<string, any>;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["MarketingExecutive", "MarketingLead", "Admin"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { customerId, purpose, notes, priority, meetingType, source, agenda, expectedDuration, department, requiresApproval, visitMetadata } = data;
    if (!customerId || !purpose) {
      return { success: false, message: "Customer ID and Purpose are required" };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userPayload.id }, select: { name: true } });
    const userName = dbUser?.name || "Employee";

    // 1. Validate executive customer assignment
    const hasAccess = await validateCustomerAccess(customerId, userPayload.id, userPayload.role);
    if (!hasAccess) {
      return { success: false, message: "Unauthorized: This customer is not assigned to you." };
    }

    // 2. Prevent duplicate check-in today
    const activeVisit = await prisma.customerVisit.findFirst({
      where: { customerId, status: "CHECKED_IN" }
    });

    if (activeVisit) {
      return { success: false, message: "Customer is already checked in. Please check out previous visit first." };
    }

    // 3. Create Inbound Visit
    const needsApproval = requiresApproval === true;
    const visit = await prisma.customerVisit.create({
      data: {
        customerId,
        hostedBy: userPayload.id,
        purpose,
        meetingSummary: notes || null,
        status: "CHECKED_IN",
        checkInTime: new Date(),
        priority: priority || "Normal",
        meetingType: meetingType || null,
        source: source || null,
        agenda: agenda || null,
        expectedDuration: expectedDuration || null,
        department: department || null,
        requiresApproval: needsApproval,
        approvalStatus: needsApproval ? "PENDING_APPROVAL" : "NOT_REQUIRED",
        visitMetadata: visitMetadata ? JSON.parse(JSON.stringify(visitMetadata)) : undefined,
      }
    });

    // Notify admins, leads, and the executive about inbound check-in
    const adminsAndLeads = await prisma.user.findMany({
      where: { isActive: true, role: { in: ["Admin", "MarketingLead"] } }
    });
    const notifyUsers = Array.from(new Set([...adminsAndLeads.map(u => u.id), userPayload.id]));

    const customerObj = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true }
    });

    if (notifyUsers.length > 0 && customerObj) {
      const approvalNote = needsApproval ? " ⚠️ Approval Required." : "";
      await prisma.notification.createMany({
        data: notifyUsers.map(uid => ({
          userId: uid,
          title: "Customer Inbound Check-In",
          message: `${customerObj.name} arrived for ${purpose}. Hosted by ${userName}.${approvalNote}`,
          type: "visit"
        }))
      });
    }

    await logAudit(userPayload.id, "VISIT", "INBOUND_CHECK_IN", `Office visit registered: ${customerId} — ${purpose}${needsApproval ? " (Approval Required)" : ""}`);
    revalidatePath("/dashboard");
    revalidatePath("/visitor-management");
    return { success: true, message: "Check-in successful", data: { id: visit.id } };
  } catch (error) {
    console.error("Inbound Checkin Error:", error);
    return { success: false, message: "Failed to register inbound check-in" };
  }
}

export async function checkOutInboundAction(data: {
  id: string;
  meetingSummary: string;
  outcome: string;
  customerDecision: string;
  rejectionReason?: string;
  nextMeetingDate?: string;
  nextMeetingNotes?: string;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["MarketingExecutive", "MarketingLead", "Admin"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { id, meetingSummary, outcome, customerDecision, rejectionReason, nextMeetingDate, nextMeetingNotes } = data;

    if (!id || !meetingSummary || !outcome || !customerDecision) {
      return { success: false, message: "Missing required checkout fields." };
    }

    // Outcomes that require a follow-up next meeting date
    const followUpOutcomes = ["Follow-up Required", "Follow-up Needed", "Pending Decision", "Interested", "Negotiation Ongoing", "Budget Hold", "Discount Requested", "Renewal Pending", "Churn Risk", "Revisit Needed", "Qualified Lead", "Proposal Needed", "Trial Requested"];
    // Outcomes that close a deal won — update customer to Active
    const closedWonOutcomes = ["Converted", "Closed Won", "Renewed", "Demo Completed"];
    // Outcomes that close a deal lost
    const closedLostOutcomes = ["Closed Lost", "Not Interested", "Not Qualified"];

    const visit = await prisma.customerVisit.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!visit) return { success: false, message: "Visit not found." };
    if (visit.status === "CHECKED_OUT") return { success: false, message: "Visit has already been checked out." };

    // Update Customer Status & Triggers based on decision + outcome
    let portalMsg = "";
    if (visit.customer?.status === "Active") {
      // If customer is already Active, protect their portal access
      portalMsg = " Customer is already active. Portal login preserved.";
    } else {
      // Outcome-driven customer status update (takes priority over portal decision for won/lost)
      if (closedWonOutcomes.includes(outcome)) {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "Active" as any }
        });
        portalMsg = " Customer promoted to Active (deal closed won).";
      } else if (customerDecision === "APPROVED") {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "APPROVED" as any }
        });
        // Send Portal Activation Email
        const emailRes = await activateCustomerPortal(visit.customerId);
        if (emailRes.success) {
          portalMsg = " Portal activation link emailed.";
        }
      } else if (customerDecision === "REJECTED" || closedLostOutcomes.includes(outcome)) {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "REJECTED" as any }
        });
        await logAudit(userPayload.id, "CUSTOMER", "REJECT", `Customer ${visit.customer.name} rejected. Reason: ${rejectionReason || "None"}. Outcome: ${outcome}`);
      } else {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "PENDING" as any }
        });
      }
    }

    // Trigger Notification back to Customer if they submitted support/renewal requests and employee updates it
    if (["Support", "Subscription Discussion"].includes(visit.purpose)) {
      if (visit.customer?.email) {
        const customerUser = await prisma.user.findFirst({
          where: { email: visit.customer.email, role: "Customer" }
        });
        if (customerUser) {
          await prisma.notification.create({
            data: {
              userId: customerUser.id,
              title: visit.purpose === "Support" ? "Support Ticket Update" : "Renewal Request Update",
              message: `Your ${visit.purpose === "Support" ? "support request" : "renewal request"} status has been updated to: ${outcome}.`,
              type: "visit"
            }
          });
        }
      }
    }

    // Create follow-up reminder if next date is provided
    if (nextMeetingDate) {
      await prisma.followUp.create({
        data: {
          customerId: visit.customerId,
          assignedUserId: userPayload.id,
          nextMeetingDate: new Date(nextMeetingDate),
          remarks: nextMeetingNotes || null,
          status: "Pending",
          visitId: visit.id,
          visitType: "INBOUND"
        }
      });
    }

    // Update Visit Record
    const updatedVisit = await prisma.customerVisit.update({
      where: { id },
      data: {
        checkOutTime: new Date(),
        meetingSummary,
        outcome,
        customerDecision,
        rejectionReason: rejectionReason || null,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
        nextMeetingNotes: nextMeetingNotes || null,
        status: "CHECKED_OUT"
      }
    });

    // Notify admins, leads, and the executive about inbound check-out
    const adminsAndLeads = await prisma.user.findMany({
      where: { isActive: true, role: { in: ["Admin", "MarketingLead"] } }
    });
    const notifyUsers = Array.from(new Set([...adminsAndLeads.map(u => u.id), userPayload.id]));

    if (notifyUsers.length > 0) {
      await prisma.notification.createMany({
        data: notifyUsers.map(uid => ({
          userId: uid,
          title: "Customer Inbound Check-Out",
          message: `Inbound Customer Checked Out: ${visit.customer.name} visit completed. Outcome: ${outcome}.`,
          type: "visit"
        }))
      });
    }

    await logAudit(userPayload.id, "VISIT", "INBOUND_CHECK_OUT", `Checked out customer from inbound visit ${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: `Checked out successfully.${portalMsg}`, data: { id: updatedVisit.id } };
  } catch (error) {
    console.error("Inbound Checkout Error:", error);
    return { success: false, message: "Failed to process checkout." };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. OUTBOUND WORKFLOWS (Executive Field Outbound Visits)
// ═══════════════════════════════════════════════════════════════
export async function checkInOutboundAction(data: {
  customerId: string;
  purpose: string;
  notes?: string;
  checkInLat?: number;
  checkInLng?: number;
  // Extended Log Field fields
  travelMode?: string;
  distanceTraveled?: number;
  expenseAmount?: number;
  requiresApproval?: boolean;
  visitMetadata?: Record<string, any>;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["MarketingExecutive", "MarketingLead", "Admin"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { customerId, purpose, notes, checkInLat, checkInLng, travelMode, distanceTraveled, expenseAmount, requiresApproval, visitMetadata } = data;
    if (!customerId || !purpose) {
      return { success: false, message: "Customer ID and Purpose are required" };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userPayload.id }, select: { name: true } });
    const userName = dbUser?.name || "Employee";

    // 1. Validate customer access
    const hasAccess = await validateCustomerAccess(customerId, userPayload.id, userPayload.role);
    if (!hasAccess) {
      return { success: false, message: "Unauthorized: Customer is not assigned to you." };
    }

    // 2. Prevent duplicate check-in today
    const activeVisit = await prisma.marketingVisit.findFirst({
      where: { customerId, status: "CHECKED_IN" }
    });

    if (activeVisit) {
      return { success: false, message: "Customer is already checked in. Please check out previous field visit first." };
    }

    // 3. Log Outbound Visit
    const needsApproval = requiresApproval === true;
    const newVisit = await prisma.marketingVisit.create({
      data: {
        executiveId: userPayload.id,
        customerId,
        purpose,
        remarks: notes || null,
        checkInLat: checkInLat || null,
        checkInLng: checkInLng || null,
        status: "CHECKED_IN",
        checkIn: new Date(),
        travelMode: travelMode || null,
        distanceTraveled: distanceTraveled || null,
        expenseAmount: expenseAmount || null,
        requiresApproval: needsApproval,
        approvalStatus: needsApproval ? "PENDING_APPROVAL" : "NOT_REQUIRED",
        visitMetadata: visitMetadata ? JSON.parse(JSON.stringify(visitMetadata)) : undefined,
      },
      include: { customer: { select: { name: true } } }
    });

    // Notify Admin and Leads about the outbound check-in
    const adminsAndLeads = await prisma.user.findMany({
      where: { isActive: true, role: { in: ["Admin", "MarketingLead"] } }
    });
    
    if (adminsAndLeads.length > 0) {
      const approvalNote = needsApproval ? " ⚠️ Approval Required." : "";
      await prisma.notification.createMany({
        data: adminsAndLeads.map(u => ({
          userId: u.id,
          title: "New Outbound Field Visit",
          message: `${userName} started a field visit with ${newVisit.customer.name} for ${purpose}${approvalNote}`,
          type: "visit"
        }))
      });
    }

    await logAudit(userPayload.id, "VISITS", "OUTBOUND_CHECKIN", `Field visit check-in: ${newVisit.customer.name} — ${purpose}${needsApproval ? " (Approval Required)" : ""}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: "Field Check-in successful", data: { id: newVisit.id } };
  } catch (error) {
    console.error("Outbound Checkin Error:", error);
    return { success: false, message: "Failed to register field visit check-in" };
  }
}

export async function checkOutOutboundAction(data: {
  id: string;
  meetingDescription: string;
  outcome: string;
  customerDecision: string;
  rejectionReason?: string;
  nextMeetingDate?: string;
  nextMeetingNotes?: string;
  checkOutLat?: number;
  checkOutLng?: number;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["MarketingExecutive", "MarketingLead", "Admin"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized" };
    }

    const { id, meetingDescription, outcome, customerDecision, rejectionReason, nextMeetingDate, nextMeetingNotes, checkOutLat, checkOutLng } = data;

    const dbUser = await prisma.user.findUnique({ where: { id: userPayload.id }, select: { name: true } });
    const userName = dbUser?.name || "Employee";

    if (!id || !meetingDescription || !outcome || !customerDecision) {
      return { success: false, message: "Missing required checkout fields." };
    }

    // Outcomes that require a follow-up next meeting date
    const followUpOutcomes = ["Follow-up Required", "Follow-up Needed", "Pending Decision", "Interested", "Negotiation Ongoing", "Budget Hold", "Discount Requested", "Renewal Pending", "Churn Risk", "Revisit Needed", "Qualified Lead", "Proposal Needed", "Trial Requested"];
    // Outcomes that close a deal won — update customer to Active
    const closedWonOutcomes = ["Converted", "Closed Won", "Renewed", "Demo Completed"];
    // Outcomes that close a deal lost
    const closedLostOutcomes = ["Closed Lost", "Not Interested", "Not Qualified"];

    const visit = await prisma.marketingVisit.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!visit) return { success: false, message: "Field visit not found." };
    if (visit.status === "CHECKED_OUT") return { success: false, message: "Visit has already been checked out." };

    // Update Customer Status based on outcome + decision
    let portalMsg = "";
    if (visit.customer?.status === "Active") {
      portalMsg = " Customer is already active. Portal login preserved.";
    } else {
      if (closedWonOutcomes.includes(outcome)) {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "Active" as any }
        });
        portalMsg = " Customer promoted to Active (deal closed won).";
      } else if (customerDecision === "APPROVED") {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "APPROVED" as any }
        });
        const emailRes = await activateCustomerPortal(visit.customerId);
        if (emailRes.success) {
          portalMsg = " Portal activation link emailed.";
        }
      } else if (customerDecision === "REJECTED" || closedLostOutcomes.includes(outcome)) {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "REJECTED" as any }
        });
        await logAudit(userPayload.id, "CUSTOMER", "REJECT", `Customer ${visit.customer.name} outcome: ${outcome}. Rejection reason: ${rejectionReason || "None"}.`);
      } else {
        await prisma.customer.update({
          where: { id: visit.customerId },
          data: { status: "PENDING" as any }
        });
      }
    }

    // Create follow-up reminder if next date is provided
    if (nextMeetingDate) {
      await prisma.followUp.create({
        data: {
          customerId: visit.customerId,
          assignedUserId: userPayload.id,
          nextMeetingDate: new Date(nextMeetingDate),
          remarks: nextMeetingNotes || null,
          status: "Pending",
          visitId: visit.id,
          visitType: "OUTBOUND"
        }
      });
    }

    // Update Field Visit Record
    const updatedVisit = await prisma.marketingVisit.update({
      where: { id },
      data: {
        checkOut: new Date(),
        meetingDescription,
        outcome,
        customerDecision,
        rejectionReason: rejectionReason || null,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
        nextMeetingNotes: nextMeetingNotes || null,
        checkOutLat: checkOutLat || null,
        checkOutLng: checkOutLng || null,
        status: "CHECKED_OUT"
      }
    });

    // Notify admins, leads, and the executive about outbound check-out
    const adminsAndLeads = await prisma.user.findMany({
      where: { isActive: true, role: { in: ["Admin", "MarketingLead"] } }
    });
    const notifyUsers = Array.from(new Set([...adminsAndLeads.map(u => u.id), userPayload.id]));

    if (notifyUsers.length > 0) {
      await prisma.notification.createMany({
        data: notifyUsers.map(uid => ({
          userId: uid,
          title: "Outbound Visit Check-Out",
          message: `${userName} checked out from field visit with ${visit.customer.name}. Outcome: ${outcome}.`,
          type: "visit"
        }))
      });
    }

    await logAudit(userPayload.id, "VISIT", "OUTBOUND_CHECK_OUT", `Executive checked out from field visit ${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: `Checked out successfully.${portalMsg}`, data: { id: updatedVisit.id } };
  } catch (error) {
    console.error("Outbound Checkout Error:", error);
    return { success: false, message: "Failed to process field check-out." };
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. VISIT HISTORY & MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export async function getVisitHistoryAction(filters?: {
  startDate?: string;
  endDate?: string;
  visitType?: string; // Inbound / Outbound
  outcome?: string;
  decision?: string;
  executiveId?: string;
}) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role === "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    const userId = userPayload.id;
    const isExecutive = userPayload.role === "MarketingExecutive";

    // Setup date filters
    let dateFilter = {};
    if (filters?.startDate || filters?.endDate) {
      dateFilter = {
        gte: filters?.startDate ? new Date(filters.startDate) : undefined,
        lte: filters?.endDate ? new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)) : undefined
      };
    }

    // 1. Fetch Inbound visits (if type matches or is empty)
    let inbound: any[] = [];
    if (!filters?.visitType || filters.visitType === "Inbound") {
      inbound = await prisma.customerVisit.findMany({
        where: {
          hostedBy: isExecutive ? userId : filters?.executiveId || undefined,
          checkInTime: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          outcome: filters?.outcome || undefined,
          customerDecision: filters?.decision || undefined
        },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          host: { select: { id: true, name: true } }
        },
        orderBy: { checkInTime: "desc" }
      });
    }

    // 2. Fetch Outbound visits
    let outbound: any[] = [];
    if (!filters?.visitType || filters.visitType === "Outbound") {
      outbound = await prisma.marketingVisit.findMany({
        where: {
          executiveId: isExecutive ? userId : filters?.executiveId || undefined,
          checkIn: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          outcome: filters?.outcome || undefined,
          customerDecision: filters?.decision || undefined
        },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          executive: { select: { id: true, name: true } }
        },
        orderBy: { checkIn: "desc" }
      });
    }

    // Normalize and combine
    const normalizedInbound = inbound.map(v => ({
      id: v.id,
      customerId: v.customerId,
      customerName: v.customer.name,
      customerCode: v.customer.customerCode,
      visitType: "Inbound",
      purpose: v.purpose,
      checkInTime: v.checkInTime.toISOString(),
      checkOutTime: v.checkOutTime ? v.checkOutTime.toISOString() : null,
      status: v.status, // Fix: include status for "In Premises" badge
      outcome: v.outcome || "Pending Checkout",
      customerDecision: v.customerDecision || "Pending Decision",
      rejectionReason: v.rejectionReason,
      nextMeetingDate: v.nextMeetingDate ? v.nextMeetingDate.toISOString() : null,
      notes: v.meetingSummary,
      executiveName: v.host.name,
      executiveId: v.hostedBy,
      priority: v.priority,
      approvalStatus: v.approvalStatus,
      department: v.department,
      createdAt: v.createdAt.toISOString()
    }));

    const normalizedOutbound = outbound.map(v => ({
      id: v.id,
      customerId: v.customerId,
      customerName: v.customer.name,
      customerCode: v.customer.customerCode,
      visitType: "Outbound",
      purpose: v.purpose || "Field Visit",
      checkInTime: v.checkIn.toISOString(),
      checkOutTime: v.checkOut ? v.checkOut.toISOString() : null,
      status: v.status, // Fix: include status for "In Premises" badge
      outcome: v.outcome || "Pending Checkout",
      customerDecision: v.customerDecision || "Pending Decision",
      rejectionReason: v.rejectionReason,
      nextMeetingDate: v.nextMeetingDate ? v.nextMeetingDate.toISOString() : null,
      notes: v.meetingDescription || v.remarks,
      executiveName: v.executive.name,
      executiveId: v.executiveId,
      approvalStatus: v.approvalStatus,
      travelMode: v.travelMode,
      expenseAmount: v.expenseAmount,
      createdAt: v.createdAt.toISOString()
    }));

    const allVisits = [...normalizedInbound, ...normalizedOutbound].sort(
      (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );

    return { success: true, data: allVisits };
  } catch (error) {
    console.error("Get Visit History Error:", error);
    return { success: false, message: "Failed to load visit history" };
  }
}

export async function editVisitRemarksAction(id: string, type: "Inbound" | "Outbound", remarks: string) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role === "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    if (type === "Inbound") {
      const visit = await prisma.customerVisit.findUnique({ where: { id } });
      if (!visit) return { success: false, message: "Visit not found." };
      
      const hoursDiff = (new Date().getTime() - visit.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) return { success: false, message: "Remarks can only be edited within 24 hours." };

      await prisma.customerVisit.update({
        where: { id },
        data: { meetingSummary: remarks }
      });
    } else {
      const visit = await prisma.marketingVisit.findUnique({ where: { id } });
      if (!visit) return { success: false, message: "Visit not found." };

      const hoursDiff = (new Date().getTime() - visit.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) return { success: false, message: "Remarks can only be edited within 24 hours." };

      await prisma.marketingVisit.update({
        where: { id },
        data: { meetingDescription: remarks }
      });
    }

    await logAudit(userPayload.id, "VISIT", "EDIT_REMARKS", `Edited remarks for ${type} visit ${id}`);
    revalidatePath("/marketing-log");
    return { success: true, message: "Remarks updated successfully" };
  } catch (error) {
    console.error("Edit Remarks Error:", error);
    return { success: false, message: "Failed to edit remarks" };
  }
}

export async function deleteVisitAction(id: string, type: "Inbound" | "Outbound") {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role !== "Admin") {
      return { success: false, message: "Unauthorized: Admin only." };
    }

    if (type === "Inbound") {
      await prisma.customerVisit.delete({ where: { id } });
    } else {
      await prisma.marketingVisit.delete({ where: { id } });
    }

    await logAudit(userPayload.id, "VISIT", "DELETE", `Deleted ${type} visit ${id}`);
    revalidatePath("/marketing-log");
    return { success: true, message: "Visit record deleted successfully." };
  } catch (error) {
    console.error("Delete Visit Error:", error);
    return { success: false, message: "Failed to delete visit record." };
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. FOLLOW-UP REMINDER LIST
// ═══════════════════════════════════════════════════════════════
export async function getFollowUpsListAction() {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role === "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    const userId = userPayload.id;
    const isExecutive = userPayload.role === "MarketingExecutive";

    const followUps = await prisma.followUp.findMany({
      where: isExecutive ? { assignedUserId: userId } : {},
      include: {
        customer: { select: { id: true, name: true, customerCode: true, status: true } },
        assignedUser: { select: { id: true, name: true } }
      },
      orderBy: { nextMeetingDate: "asc" }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    in7Days.setHours(23, 59, 59, 999);

    const normalized = followUps.map(f => {
      let badgeStatus: "UPCOMING" | "OVERDUE" | "TODAY" = "UPCOMING";
      if (f.status === "Completed") {
        badgeStatus = "UPCOMING"; // Completed, can be shown as non-urgent
      } else {
        const nextDate = new Date(f.nextMeetingDate);
        if (nextDate < startOfToday) {
          badgeStatus = "OVERDUE";
        } else if (nextDate >= startOfToday && nextDate <= endOfToday) {
          badgeStatus = "TODAY";
        }
      }

      return {
        id: f.id,
        customerId: f.customerId,
        customerName: f.customer.name,
        customerCode: f.customer.customerCode,
        customerStatus: f.customer.status,
        nextMeetingDate: f.nextMeetingDate.toISOString(),
        notes: f.remarks || f.notes,
        assignedToName: f.assignedUser.name,
        visitId: f.visitId,
        visitType: f.visitType,
        status: f.status,
        badgeStatus
      };
    });

    return { success: true, data: normalized };
  } catch (error) {
    console.error("Get Followups Error:", error);
    return { success: false, message: "Failed to fetch follow-ups list" };
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. CUSTOMER DECISION SUMMARY (Lead View Only)
// ═══════════════════════════════════════════════════════════════
export async function getCustomerDecisionSummaryAction() {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["MarketingLead", "Admin"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized: Marketing Lead or Admin only." };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Dynamic stats aggregates
    const totalVisitedThisMonth = await prisma.customerVisit.count({
      where: { checkInTime: { gte: startOfMonth } }
    }) + await prisma.marketingVisit.count({
      where: { checkIn: { gte: startOfMonth } }
    });

    const approvedCount = await prisma.customer.count({
      where: { status: "APPROVED" as any }
    });

    const rejectedCount = await prisma.customer.count({
      where: { status: "REJECTED" as any }
    });

    const pendingCount = await prisma.customer.count({
      where: { status: "PENDING" as any }
    });

    const totalCustomers = await prisma.customer.count();
    const conversionRate = totalCustomers > 0 
      ? Math.round((approvedCount / totalCustomers) * 100)
      : 0;

    const pendingCustomersList = await prisma.customer.findMany({
      where: { status: "PENDING" as any },
      include: {
        assignedUser: { select: { id: true, name: true } },
        subscriptions: { select: { id: true, planName: true, status: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    const visitHistory = await prisma.customerVisit.findMany({
      include: {
        customer: {
          select: { id: true, name: true, customerCode: true, status: true, email: true, phone: true }
        },
        host: {
          select: { id: true, name: true }
        }
      },
      orderBy: { checkInTime: "desc" }
    });

    return {
      success: true,
      data: {
        totalVisitedThisMonth,
        approvedCount,
        rejectedCount,
        pendingCount,
        conversionRate,
        pendingCustomersList,
        visitHistory
      }
    };
  } catch (error) {
    console.error("Get Decision Summary Error:", error);
    return { success: false, message: "Failed to fetch customer decision summary." };
  }
}

export async function updateCustomerStatusAction(params: { id: string; status: string; reason?: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["MarketingLead", "Admin"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized: Lead or Admin only." };
    }

    const { id, status, reason } = params;
    if (!id || !status) return { success: false, message: "Customer ID and status are required." };

    const customer = await prisma.customer.update({
      where: { id },
      data: { status: status as any }
    });

    await logAudit(
      userPayload.id,
      "Customer",
      status === "APPROVED" ? "APPROVED" : "REJECTED",
      `Customer ${customer.name} status updated to ${status}. Reason: ${reason || "None"}`
    );

    revalidatePath("/decision-summary");
    return { success: true, message: `Customer status updated successfully.` };
  } catch (error) {
    console.error("Update Customer Status Error:", error);
    return { success: false, message: "Failed to update customer status." };
  }
}

export async function createCustomerSupportAction(data: { subject: string; description: string; severity: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role !== "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    const { subject, description, severity } = data;
    if (!subject || !description || !severity) {
      return { success: false, message: "Subject, description, and severity are required" };
    }

    const customer = await prisma.customer.findUnique({
      where: { email: userPayload.email },
    });
    if (!customer) return { success: false, message: "Customer profile not found." };

    let hostId = customer.assignedUserId;
    if (!hostId) {
      const firstAdmin = await prisma.user.findFirst({
        where: { role: "Admin", isActive: true }
      });
      hostId = firstAdmin?.id || "";
    }

    if (!hostId) {
      return { success: false, message: "System error: No employee is available to host this request." };
    }

    const visit = await prisma.customerVisit.create({
      data: {
        customerId: customer.id,
        hostedBy: hostId,
        purpose: "Support",
        meetingSummary: `Support Ticket Subject: ${subject}. Description: ${description}`,
        outcome: "Enquired to IT",
        customerDecision: "PENDING",
        status: "CHECKED_IN"
      }
    });

    const internalUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { in: ["Admin", "MarketingLead"] } },
          { id: hostId }
        ]
      }
    });

    if (internalUsers.length > 0) {
      await prisma.notification.createMany({
        data: internalUsers.map(u => ({
          userId: u.id,
          title: "New Support Request",
          message: `${customer.name} submitted a Support Ticket: '${subject}' (Severity: ${severity})`,
          type: "visit"
        }))
      });
    }

    await logAudit(userPayload.id, "CUSTOMER_PORTAL", "SUPPORT_REQUESTED", `Customer filed support ticket: ${subject}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: "Support ticket registered successfully." };
  } catch (error) {
    console.error("Create Customer Support Error:", error);
    return { success: false, message: "Failed to submit support ticket." };
  }
}

export async function createCustomerRenewalRequestAction(data: { planName: string; notes: string; startDate: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || userPayload.role !== "Customer") {
      return { success: false, message: "Unauthorized" };
    }

    const { planName, notes, startDate } = data;
    if (!planName || !startDate) {
      return { success: false, message: "Plan name and start date are required" };
    }

    const customer = await prisma.customer.findUnique({
      where: { email: userPayload.email },
    });
    if (!customer) return { success: false, message: "Customer profile not found." };

    let hostId = customer.assignedUserId;
    if (!hostId) {
      const firstAdmin = await prisma.user.findFirst({
        where: { role: "Admin", isActive: true }
      });
      hostId = firstAdmin?.id || "";
    }

    if (!hostId) {
      return { success: false, message: "System error: No employee is available to host this request." };
    }

    const visit = await prisma.customerVisit.create({
      data: {
        customerId: customer.id,
        hostedBy: hostId,
        purpose: "Subscription Discussion",
        meetingSummary: `Renewal requested for plan: ${planName}. Notes: ${notes || "None"}`,
        outcome: "Renewal Requested",
        customerDecision: "PENDING",
        status: "CHECKED_IN"
      }
    });

    const internalUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { in: ["Admin", "MarketingLead"] } },
          { id: hostId }
        ]
      }
    });

    if (internalUsers.length > 0) {
      await prisma.notification.createMany({
        data: internalUsers.map(u => ({
          userId: u.id,
          title: "Renewal Requested",
          message: `${customer.name} requested renewal for: '${planName}'`,
          type: "visit"
        }))
      });
    }

    await logAudit(userPayload.id, "CUSTOMER_PORTAL", "RENEWAL_REQUESTED", `Customer requested renewal for: ${planName}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: "Renewal request submitted successfully." };
  } catch (error) {
    console.error("Create Customer Renewal Request Error:", error);
    return { success: false, message: "Failed to submit renewal request." };
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. VISIT APPROVAL ACTIONS (Admin / Lead only)
// ═══════════════════════════════════════════════════════════════
export async function approveVisitAction(data: { visitId: string; visitType: "Inbound" | "Outbound"; comments?: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized: Admin or Marketing Lead only." };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userPayload.id }, select: { name: true } });
    const userName = dbUser?.name || "Employee";

    const { visitId, visitType, comments } = data;

    if (visitType === "Inbound") {
      const visit = await prisma.customerVisit.findUnique({ where: { id: visitId }, include: { host: true } });
      if (!visit) return { success: false, message: "Visit not found." };
      if (visit.approvalStatus !== "PENDING_APPROVAL") return { success: false, message: "This visit is not pending approval." };

      await prisma.customerVisit.update({
        where: { id: visitId },
        data: { approvalStatus: "APPROVED", approvalComments: comments || null }
      });

      // Notify the host executive
      await prisma.notification.create({
        data: {
          userId: visit.hostedBy,
          title: "Visit Approved ✓",
          message: `Your office visit (${visit.purpose}) has been approved by ${userName}.${comments ? ` Note: ${comments}` : ""}`,
          type: "visit"
        }
      });
    } else {
      const visit = await prisma.marketingVisit.findUnique({ where: { id: visitId }, include: { executive: true } });
      if (!visit) return { success: false, message: "Field visit not found." };
      if (visit.approvalStatus !== "PENDING_APPROVAL") return { success: false, message: "This visit is not pending approval." };

      await prisma.marketingVisit.update({
        where: { id: visitId },
        data: { approvalStatus: "APPROVED", approvalComments: comments || null }
      });

      // Notify the executive
      await prisma.notification.create({
        data: {
          userId: visit.executiveId,
          title: "Field Visit Approved ✓",
          message: `Your field visit (${visit.purpose}) has been approved by ${userName}.${comments ? ` Note: ${comments}` : ""}`,
          type: "visit"
        }
      });
    }

    await logAudit(userPayload.id, "VISIT", "APPROVE_VISIT", `Approved ${visitType} visit ${visitId}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: "Visit approved successfully." };
  } catch (error) {
    console.error("Approve Visit Error:", error);
    return { success: false, message: "Failed to approve visit." };
  }
}

export async function rejectVisitAction(data: { visitId: string; visitType: "Inbound" | "Outbound"; reason: string }) {
  try {
    const userPayload = await verifyAuth();
    if (!userPayload || !["Admin", "MarketingLead"].includes(userPayload.role)) {
      return { success: false, message: "Unauthorized: Admin or Marketing Lead only." };
    }

    const { visitId, visitType, reason } = data;
    if (!reason?.trim()) return { success: false, message: "Rejection reason is required." };

    if (visitType === "Inbound") {
      const visit = await prisma.customerVisit.findUnique({ where: { id: visitId } });
      if (!visit) return { success: false, message: "Visit not found." };

      await prisma.customerVisit.update({
        where: { id: visitId },
        data: { approvalStatus: "REJECTED", approvalComments: reason }
      });

      await prisma.notification.create({
        data: {
          userId: visit.hostedBy,
          title: "Visit Rejected",
          message: `Your office visit (${visit.purpose}) was rejected. Reason: ${reason}`,
          type: "visit"
        }
      });
    } else {
      const visit = await prisma.marketingVisit.findUnique({ where: { id: visitId } });
      if (!visit) return { success: false, message: "Field visit not found." };

      await prisma.marketingVisit.update({
        where: { id: visitId },
        data: { approvalStatus: "REJECTED", approvalComments: reason }
      });

      await prisma.notification.create({
        data: {
          userId: visit.executiveId,
          title: "Field Visit Rejected",
          message: `Your field visit (${visit.purpose || "Field Visit"}) was rejected. Reason: ${reason}`,
          type: "visit"
        }
      });
    }

    await logAudit(userPayload.id, "VISIT", "REJECT_VISIT", `Rejected ${visitType} visit ${visitId}. Reason: ${reason}`);
    revalidatePath("/dashboard");
    revalidatePath("/marketing-log");
    return { success: true, message: "Visit rejected." };
  } catch (error) {
    console.error("Reject Visit Error:", error);
    return { success: false, message: "Failed to reject visit." };
  }
}
