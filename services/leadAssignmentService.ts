import { prisma } from "@/lib/prisma";

export interface AssignedUser {
  id: string;
  name: string;
}

/**
 * Shared lead assignment logic used by Manual entry, Bulk Excel upload, and Meta webhooks.
 * Implements workload-based round-robin assignment with configurable modes.
 */
export async function assignLeadToUser(companyId: string | null): Promise<AssignedUser | null> {
  // Fetch system configurations
  const configs = await prisma.systemConfig.findMany();
  const configMap = new Map(configs.map((c) => [c.key, c.value]));

  const assignmentMode = configMap.get("leads_assignment_mode") || "ROUND_ROBIN";
  const defaultAssigneeId = configMap.get("leads_default_assignee_id") || "";

  let assignedUser: AssignedUser | null = null;

  // DEFAULT_POOL mode: assign to specific user if configured
  if (assignmentMode === "DEFAULT_POOL" && defaultAssigneeId) {
    assignedUser = await prisma.user.findFirst({
      where: { id: defaultAssigneeId, isActive: true },
      select: { id: true, name: true },
    });
  }

  // ROUND_ROBIN mode: workload-based assignment
  if (!assignedUser) {
    // Fetch executives with their active workload count
    let executives = await prisma.user.findMany({
      where: { role: "SalesExecutive", isActive: true },
      select: {
        id: true,
        name: true,
        leads: {
          where: { status: { in: ["New", "Contacted"] } },
          select: { id: true },
        },
      },
    });

    // Fallback to Sales Managers if no executives
    if (executives.length === 0) {
      executives = await prisma.user.findMany({
        where: { role: "SalesManager", isActive: true },
        select: {
          id: true,
          name: true,
          leads: {
            where: { status: { in: ["New", "Contacted"] } },
            select: { id: true },
          },
        },
      });
    }

    if (executives.length > 0) {
      // Sort ascending by active lead count (least busy first)
      executives.sort((a, b) => a.leads.length - b.leads.length);
      assignedUser = { id: executives[0].id, name: executives[0].name };
    } else {
      // Ultimate fallback: Admin
      assignedUser = await prisma.user.findFirst({
        where: { role: "Admin", isActive: true },
        select: { id: true, name: true },
      });
    }
  }

  return assignedUser;
}
