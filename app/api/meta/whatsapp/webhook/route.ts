import { NextRequest, NextResponse } from "next/server";
import { verifyMetaWebhookChallenge, verifyMetaWebhookSignature } from "@/utils/webhookVerifier";
import { getMetaConfig } from "@/lib/meta";
import { processWhatsAppMessage } from "@/services/whatsappMessageService";
import { logWebhookEvent } from "@/services/webhookLoggingService";

/**
 * Meta WhatsApp Cloud API Webhook
 * 
 * GET: Webhook verification (challenge-response)
 * POST: Message ingestion from WhatsApp
 */

export async function GET(request: NextRequest) {
  console.log("WhatsApp GET webhook received");
  
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  
  console.log(`WhatsApp GET verification: mode=${mode}, token=${token}, challenge=${challenge}`);
  
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;
  
  const validChallenge = verifyMetaWebhookChallenge(mode, token, challenge, verifyToken || "");
  
  if (validChallenge) {
    console.log("WhatsApp GET verification successful, returning challenge");
    return new NextResponse(validChallenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  
  console.log("WhatsApp GET verification failed");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log("WhatsApp POST webhook received");
  
  try {
    const config = getMetaConfig();
    
    // Verify webhook signature if provided
    const signature = request.headers.get("x-hub-signature-256");
    const rawBody = await request.text();
    
    console.log(`WhatsApp POST body:`, rawBody);
    console.log(`WhatsApp POST signature:`, signature);
    
    if (signature && config.appSecret) {
      const isValid = verifyMetaWebhookSignature(rawBody, signature, config.appSecret);
      if (!isValid) {
        console.error("Invalid webhook signature from WhatsApp");
        await logWebhookEvent({
          source: "whatsapp",
          eventType: "signature_verification_failed",
          payload: { signature: "redacted" },
          status: "failed",
          errorMessage: "Invalid webhook signature",
          processingTimeMs: Date.now() - startTime,
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }
    
    const payload = JSON.parse(rawBody);
    console.log(`WhatsApp POST parsed payload:`, JSON.stringify(payload, null, 2));
    
    // Handle WhatsApp message events
    if (payload.entry && payload.entry[0]?.changes) {
      for (const change of payload.entry[0].changes) {
        if (change.field === "messages" && change.value) {
          const messageData = change.value;
          
          // Check if this is a status event (delivery, read, sent) or actual message
          const statuses = messageData.statuses;
          const messages = messageData.messages;
          
          if (statuses && statuses.length > 0) {
            // Status event (delivery/read/sent receipt)
            console.log(`WhatsApp status event: ${statuses[0].status} for message ${statuses[0].id}`);
            await logWebhookEvent({
              source: "whatsapp",
              eventType: "status",
              payload: { status: statuses[0].status, messageId: statuses[0].id },
              status: "success",
              processingTimeMs: Date.now() - startTime,
            });
            continue;
          }
          
          // Extract message and contact information
          const message = messages?.[0];
          const contact = messageData.contacts?.[0];
          
          if (!message) {
            console.log("No message data in WhatsApp webhook");
            continue;
          }
          
          const whatsappMessage = {
            from: message.from,
            from_name: contact?.profile?.name,
            id: message.id,
            text: message.text,
            type: message.type,
            timestamp: message.timestamp,
          };
          
          console.log(`Received WhatsApp message from ${whatsappMessage.from}:`, JSON.stringify(whatsappMessage, null, 2));
          
          // Process message (creates Lead or Activity)
          const result = await processWhatsAppMessage(whatsappMessage, contact);
          
          // Log webhook event
          await logWebhookEvent({
            source: "whatsapp",
            eventType: "message",
            payload: { from: whatsappMessage.from, messageId: whatsappMessage.id, type: whatsappMessage.type },
            status: result.success ? "success" : (result.error === "Duplicate message" ? "duplicate-skipped" : "failed"),
            errorMessage: result.error,
            leadId: result.leadId,
            processingTimeMs: Date.now() - startTime,
          });
          
          if (result.success) {
            console.log(`Successfully processed WhatsApp message: leadId=${result.leadId}, activityId=${result.activityId}`);
          } else {
            console.error(`Failed to process WhatsApp message:`, result.error);
          }
        }
      }
    }
    
    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
