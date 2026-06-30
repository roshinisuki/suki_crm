import { prisma } from "@/lib/prisma";

/**
 * Webhook logging service.
 * Logs all incoming webhook events to WebhookLog table for debugging and audit.
 */

export async function logWebhookEvent(params: {
  source: "facebook" | "instagram" | "whatsapp";
  eventType: string;
  payload: any;
  status: "success" | "failed" | "duplicate-skipped";
  errorMessage?: string;
  leadId?: string;
  processingTimeMs?: number;
  companyId?: string;
}): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        source: params.source,
        eventType: params.eventType,
        payload: JSON.stringify(params.payload),
        status: params.status,
        errorMessage: params.errorMessage,
        leadId: params.leadId,
        processingTimeMs: params.processingTimeMs,
        companyId: params.companyId,
      },
    });
  } catch (error) {
    // Logging failure should not break the webhook processing
    console.error("Failed to log webhook event:", error);
  }
}
