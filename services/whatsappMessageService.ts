import { prisma } from "@/lib/prisma";
import { normalizePhoneToE164 } from "@/utils/phoneNormalization";
import { assignLeadToUser } from "./leadAssignmentService";
import { nanoid } from "nanoid";

/**
 * WhatsApp message service.
 * Handles inbound WhatsApp messages and creates Leads or Activity entries.
 */

interface WhatsAppMessage {
  from: string;           // Sender phone number
  from_name?: string;     // Contact name from WhatsApp profile
  id: string;             // Message ID (for dedup)
  text?: { body: string }; // Message text
  type: string;           // text, image, document, audio, video
  timestamp: string;      // Unix timestamp
}

interface WhatsAppContact {
  profile?: {
    name: string;
  };
}

/**
 * Generate unique lead code for WhatsApp leads.
 */
async function generateWhatsAppLeadCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LD-${year}-`;

  const count = await prisma.lead.count({
    where: { leadCode: { startsWith: prefix } },
  });

  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}${seq}`;
}

/**
 * Process an inbound WhatsApp message.
 * Creates a new Lead if first contact, or adds Activity entry if Lead exists.
 */
export async function processWhatsAppMessage(
  message: WhatsAppMessage,
  contact?: WhatsAppContact
): Promise<{ success: boolean; leadId?: string; activityId?: string; error?: string }> {
  try {
    // Normalize sender phone number
    const normalizedPhone = normalizePhoneToE164(message.from);
    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number" };
    }

    // Check if message already processed (dedup by message ID)
    const existingActivity = await prisma.communicationLog.findFirst({
      where: {
        agenda: message.id, // Store message ID in agenda field for dedup
      },
    });

    if (existingActivity) {
      console.log(`Duplicate WhatsApp message ignored: ${message.id}`);
      return { success: true, error: "Duplicate message" };
    }

    // Check if Lead already exists with this phone number
    const existingLead = await prisma.lead.findFirst({
      where: { phone: normalizedPhone, deletedAt: null },
    });

    if (existingLead) {
      // Lead exists: create Activity entry
      const messageText = message.text?.body || `[${message.type} message]`;
      const now = new Date();

      const activity = await prisma.communicationLog.create({
        data: {
          id: nanoid(),
          channel: "WhatsApp",
          leadId: existingLead.id,
          customerId: null,
          dealId: null,
          direction: "Inbound",
          content: messageText,
          status: "Completed",
          sentByUserId: null, // System-generated
          sentAt: now,
          agenda: message.id, // Store message ID for dedup
          companyId: existingLead.companyId,
        },
      });

      // Update lead's lastInteractionAt
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { lastInteractionAt: now },
      });

      console.log(`WhatsApp message added as Activity for existing lead: ${existingLead.leadCode}`);
      return { success: true, leadId: existingLead.id, activityId: activity.id };
    }

    // No existing Lead: create new Lead
    const contactName = contact?.profile?.name || message.from_name || `WhatsApp Contact ${normalizedPhone}`;
    const messageText = message.text?.body || "";

    // Assign lead using shared assignment logic
    const assignedUser = await assignLeadToUser(null);

    // Generate lead code
    const leadCode = await generateWhatsAppLeadCode();

    // Calculate SLA deadline (15 minutes)
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 15 * 60 * 1000);

    // Create Lead record
    const lead = await prisma.lead.create({
      data: {
        leadCode,
        name: contactName,
        phone: normalizedPhone,
        leadSource: "WhatsApp",
        sourceMeta: JSON.stringify({
          messageId: message.id,
          messageType: message.type,
          timestamp: message.timestamp,
          rawMessage: message,
          contact,
        }),
        notes: messageText || null,
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
          reason: "Inbound auto-assignment via WhatsApp (Workload-Based)",
        },
      });
    }

    // Create initial Activity entry for the first message
    const activity = await prisma.communicationLog.create({
      data: {
        id: nanoid(),
        channel: "WhatsApp",
        leadId: lead.id,
        customerId: null,
        dealId: null,
        direction: "Inbound",
        content: messageText || `[${message.type} message]`,
        status: "Completed",
        sentByUserId: null,
        sentAt: now,
        agenda: message.id,
        companyId: lead.companyId,
      },
    });

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
          remarks: `Auto-generated follow-up: New WhatsApp enquiry from ${contactName}. Message: ${messageText || "No text"}`,
          status: "Pending",
          sourceType: "LEAD_INGESTION",
          autoCreated: true,
        },
      }).catch(() => {}); // Non-blocking
    }

    console.log(`Successfully created WhatsApp lead: ${lead.leadCode} (${contactName})`);
    return { success: true, leadId: lead.id, activityId: activity.id };
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return { success: false, error: "Internal server error" };
  }
}
