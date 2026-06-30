import { prisma } from "@/lib/prisma";
import { fetchLeadData } from "@/lib/meta";
import { normalizePhoneToE164 } from "@/utils/phoneNormalization";
import { assignLeadToUser } from "./leadAssignmentService";
import { nanoid } from "nanoid";

/**
 * Meta Lead Ads ingestion service.
 * Processes Facebook and Instagram Lead Ads webhooks and ingests into the existing Lead table.
 */

interface MetaLeadField {
  name: string;
  values: string[];
}

interface MetaLeadData {
  id: string;
  created_time: string;
  ad_id?: string;
  form_id: string;
  field_data: MetaLeadField[];
  platform?: string;
}

/**
 * Extract lead fields from Meta field_data array.
 */
function extractLeadFields(fieldData: MetaLeadField[]): {
  name: string;
  email: string | null;
  phone: string | null;
  customFields: string[];
} {
  let name = "";
  let email: string | null = null;
  let phone: string | null = null;
  const customFields: string[] = [];

  for (const field of fieldData) {
    const value = field.values?.[0] || "";

    switch (field.name.toLowerCase()) {
      case "full_name":
      case "name":
      case "first_name":
        name = value;
        break;
      case "email":
        email = value;
        break;
      case "phone_number":
      case "phone":
        phone = value;
        break;
      default:
        // Store custom fields as labeled text
        customFields.push(`${field.name}: ${value}`);
    }
  }

  return { name, email, phone, customFields };
}

/**
 * Generate unique lead code for Meta leads.
 */
async function generateMetaLeadCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LD-${year}-`;

  const count = await prisma.lead.count({
    where: { leadCode: { startsWith: prefix } },
  });

  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}${seq}`;
}

/**
 * Ingest a Meta lead (Facebook or Instagram) into the existing Lead table.
 */
export async function ingestMetaLead(
  leadgenId: string,
  pageId: string,
  formId: string,
  platform: "Facebook" | "Instagram"
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    // Fetch full lead data from Graph API
    const leadData = await fetchLeadData(leadgenId);
    if (!leadData) {
      return { success: false, error: "Failed to fetch lead data from Meta Graph API" };
    }

    // Extract lead fields
    const { name, email, phone, customFields } = extractLeadFields(leadData.field_data);

    if (!name) {
      return { success: false, error: "Lead name is required" };
    }

    // Normalize phone to E.164
    const normalizedPhone = normalizePhoneToE164(phone);

    // Check for duplicates (email and phone)
    if (email) {
      const existingEmail = await prisma.lead.findUnique({
        where: { email: email.trim() },
      });
      if (existingEmail) {
        console.log(`Duplicate lead detected by email: ${email}`);
        return { success: false, error: "Duplicate lead (email already exists)" };
      }
    }

    if (normalizedPhone) {
      const existingPhone = await prisma.lead.findFirst({
        where: { phone: normalizedPhone },
      });
      if (existingPhone) {
        console.log(`Duplicate lead detected by phone: ${normalizedPhone}`);
        return { success: false, error: "Duplicate lead (phone already exists)" };
      }
    }

    // Assign lead using shared assignment logic
    const assignedUser = await assignLeadToUser(null);

    // Generate lead code
    const leadCode = await generateMetaLeadCode();

    // Calculate SLA deadline (15 minutes)
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 15 * 60 * 1000);

    // Build notes with custom fields
    const notes = customFields.length > 0
      ? customFields.join("\n")
      : null;

    // Create Lead record
    const lead = await prisma.lead.create({
      data: {
        leadCode,
        name: name.trim(),
        email: email?.trim() || null,
        phone: normalizedPhone,
        leadSource: platform,
        sourceMeta: JSON.stringify({
          leadgenId,
          pageId,
          formId,
          adId: leadData.ad_id,
          platform,
          rawLeadData: leadData,
        }),
        notes,
        status: "New",
        assignedUserId: assignedUser?.id || null,
        slaStatus: "Pending",
        slaResponseDeadline: slaDeadline,
        lastInteractionAt: now,
        escalationLevel: 0,
      },
    });

    // Log initial assignment to LeadOwnerHistory
    if (assignedUser) {
      await prisma.leadOwnerHistory.create({
        data: {
          leadId: lead.id,
          fromUserId: null,
          toUserId: assignedUser.id,
          changedById: null,
          reason: `Inbound auto-assignment via ${platform} Lead Ads (Workload-Based)`,
        },
      });
    }

    // Auto follow-up task for tomorrow at 9 AM
    if (assignedUser) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          assignedUserId: assignedUser.id,
          nextMeetingDate: tomorrow,
          dueDate: tomorrow,
          remarks: `Auto-generated follow-up: New ${platform} Lead Ads enquiry from ${name}.`,
          status: "Pending",
          sourceType: "LEAD_INGESTION",
          autoCreated: true,
        },
      }).catch(() => {}); // Non-blocking
    }

    console.log(`Successfully ingested ${platform} lead: ${lead.leadCode} (${name})`);
    return { success: true, leadId: lead.id };
  } catch (error) {
    console.error(`Error ingesting ${platform} lead:`, error);
    return { success: false, error: "Internal server error" };
  }
}
