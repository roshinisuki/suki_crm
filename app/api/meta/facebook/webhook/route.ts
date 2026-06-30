import { NextRequest, NextResponse } from "next/server";
import { verifyMetaWebhookChallenge, verifyMetaWebhookSignature } from "@/utils/webhookVerifier";
import { getMetaConfig } from "@/lib/meta";
import { ingestMetaLead } from "@/services/metaLeadIngestionService";
import { logWebhookEvent } from "@/services/webhookLoggingService";

/**
 * Meta Facebook + Instagram Lead Ads Webhook
 * 
 * GET: Webhook verification (challenge-response)
 * POST: Lead ingestion from Facebook/Instagram Lead Ads
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  
  const verifyToken = process.env.META_VERIFY_TOKEN;
  
  const validChallenge = verifyMetaWebhookChallenge(mode, token, challenge, verifyToken || "");
  
  if (validChallenge) {
    return new NextResponse(validChallenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const config = getMetaConfig();
    
    // Verify webhook signature if provided
    const signature = request.headers.get("x-hub-signature-256");
    const rawBody = await request.text();
    
    if (signature && config.appSecret) {
      const isValid = verifyMetaWebhookSignature(rawBody, signature, config.appSecret);
      if (!isValid) {
        console.error("Invalid webhook signature from Facebook/Instagram");
        await logWebhookEvent({
          source: "facebook",
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
    
    // Handle leadgen field webhook events
    if (payload.entry && payload.entry[0]?.changes) {
      for (const change of payload.entry[0].changes) {
        if (change.field === "leadgen" && change.value) {
          const leadgenId = change.value.leadgen_id;
          const pageId = change.value.page_id;
          const formId = change.value.form_id;
          
          console.log(`Received leadgen event: leadgen_id=${leadgenId}, page_id=${pageId}, form_id=${formId}`);
          
          // Determine platform (Facebook vs Instagram)
          // Instagram leads come through the same webhook but have different platform metadata
          const platform = change.value.platform === "instagram" ? "Instagram" : "Facebook";
          
          // Ingest lead into existing Lead table
          const result = await ingestMetaLead(leadgenId, pageId, formId, platform);
          
          // Log webhook event
          await logWebhookEvent({
            source: platform.toLowerCase() as "facebook" | "instagram",
            eventType: "leadgen",
            payload: { leadgenId, pageId, formId, platform },
            status: result.success ? "success" : "failed",
            errorMessage: result.error,
            leadId: result.leadId,
            processingTimeMs: Date.now() - startTime,
          });
          
          if (result.success) {
            console.log(`Successfully ingested ${platform} lead: ${result.leadId}`);
          } else {
            console.error(`Failed to ingest ${platform} lead:`, result.error);
          }
        }
      }
    }
    
    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("Facebook/Instagram webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
