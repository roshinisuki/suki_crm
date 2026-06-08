import { prisma } from "@/lib/prisma";
import { CustomerStatus } from "@prisma/client";

// Define the hierarchy of stages for validation
export const PIPELINE_STAGES: Record<CustomerStatus, number> = {
  New: 0,
  Prospect: 0,
  PENDING: 0,
  Contacted: 1,
  Qualified: 2,
  ProposalSent: 3,
  Negotiation: 4,
  Converted: 5,
  Active: 5,
  APPROVED: 5,
  Lost: 5,
  REJECTED: 5,
  Inactive: -1,
};

export async function processVisitOutcome(
  customerId: string,
  outcome: string,
  customerDecision: string
): Promise<{ success: boolean; newStatus?: CustomerStatus; error?: string; portalMsg?: string }> {
  // Define outcome groupings based on strict CRM pipeline
  const followUpOutcomes = [
    "Follow-up Required", "Follow-up Needed", "Pending Decision", "Interested",
    "Budget Hold", "Discount Requested", "Renewal Pending", "Revisit Needed",
    "Trial Requested", "Demo Rescheduled"
  ];
  
  const qualifiedOutcomes = ["Qualified Lead", "Demo Completed"];
  const proposalOutcomes = ["Proposal Needed", "Quotation Sent"];
  const negotiationOutcomes = ["Negotiation Ongoing"];
  
  const closedWonOutcomes = ["Converted", "Closed Won", "Renewed", "Resolved"];
  const closedLostOutcomes = ["Closed Lost", "Not Interested", "Not Qualified", "Churn Risk"];

  // Fetch current customer to get their status
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { status: true, id: true, name: true, email: true }
  });

  if (!customer) {
    return { success: false, error: "Customer not found." };
  }

  const currentStatus = customer.status as CustomerStatus;
  const currentStage = PIPELINE_STAGES[currentStatus] ?? -1;

  let nextStatus = currentStatus; // Default to keeping the same state
  let requiresPortalActivation = false;
  let portalMsg = "";

  // Map outcome to target status
  if (closedWonOutcomes.includes(outcome)) {
    nextStatus = "Converted";
  } else if (closedLostOutcomes.includes(outcome)) {
    nextStatus = "Lost";
  } else if (negotiationOutcomes.includes(outcome)) {
    nextStatus = "Negotiation";
  } else if (proposalOutcomes.includes(outcome)) {
    nextStatus = "ProposalSent";
  } else if (qualifiedOutcomes.includes(outcome)) {
    nextStatus = "Qualified";
  } else if (followUpOutcomes.includes(outcome)) {
    // Only move to Contacted if they are currently New/Prospect.
    // If they are in Negotiation and need a follow-up, keep them in Negotiation.
    if (currentStage < PIPELINE_STAGES.Contacted) {
      nextStatus = "Contacted";
    }
  }

  // STRICT VALIDATION: ProposalSent & Negotiation require Create Deal (i.e. already past Qualified)
  if (["ProposalSent", "Negotiation"].includes(nextStatus)) {
    if (currentStage < PIPELINE_STAGES.Qualified) {
      return { 
        success: false, 
        error: `Invalid pipeline transition: Cannot move to ${nextStatus === "ProposalSent" ? "Proposal Sent" : "Negotiation"} before Lead is Qualified and Deal is created.`
      };
    }
  }

  // Portal Decision Logic overrides specific pipeline statuses
  if (customerDecision === "APPROVED") {
    requiresPortalActivation = true;
    if (nextStatus !== "Converted" && nextStatus !== "Active") {
        nextStatus = "APPROVED";
    }
  } else if (customerDecision === "REJECTED") {
    nextStatus = "REJECTED";
  } else if (nextStatus === "Converted" || nextStatus === "Active") {
      nextStatus = "Active";
  } else if (customerDecision === "PENDING" && currentStatus === "New" && nextStatus === "New") {
      // Preserve old behavior where it goes to PENDING if no pipeline progression and no portal decision
      nextStatus = "PENDING";
  }

  // Preserve Active status if already active (unless rejecting)
  if (currentStatus === "Active" || currentStatus === "APPROVED") {
    if (!["Lost", "REJECTED"].includes(nextStatus)) {
      nextStatus = currentStatus;
      portalMsg = " Customer is already active. Portal login preserved.";
    }
  }

  // Update customer
  if (nextStatus !== currentStatus || requiresPortalActivation) {
      await prisma.customer.update({
          where: { id: customerId },
          data: { status: nextStatus }
      });
  }

  // Portal activation email
  if (requiresPortalActivation && currentStatus !== "Active" && currentStatus !== "APPROVED") {
    // Dynamically import to avoid cyclic dependencies if any
    const { activateCustomerPortal } = await import("@/app/actions/auth");
    const emailRes = await activateCustomerPortal(customerId);
    if (emailRes.success) {
      portalMsg = " Portal activation link emailed.";
    }
  } else if (nextStatus === "Active" && currentStatus !== "Active") {
      portalMsg = " Customer promoted to Active (deal closed won).";
  }

  return { success: true, newStatus: nextStatus, portalMsg };
}
