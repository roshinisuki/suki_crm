# Meta Integration Setup Guide
## WhatsApp + Facebook + Instagram Lead Ads (Sandbox/Test Phase)

This guide covers setting up Meta (Facebook, Instagram, WhatsApp) webhooks for the CRM's sandbox/test integration.

---

## Prerequisites

- Meta Developer Account (free)
- Test Facebook Page
- Test Instagram Business Account (connected to the test Page)
- WhatsApp Business Sandbox number (free from Meta)
- ngrok (for local development webhook testing)

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Meta App Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_VERIFY_TOKEN=your_custom_verify_token
META_PAGE_ACCESS_TOKEN=your_page_access_token
META_GRAPH_API_VERSION=v23.0

# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
```

**Security Note:** These are sandbox/test values. For production, regenerate all tokens under a verified business account.

---

## Phase 1: Configure Meta App

### 1.1 Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Create App" → Select "Business" type
3. Name your app (e.g., "Suki CRM Integration")
4. Add products:
   - **WhatsApp** (for messaging)
   - **Facebook Login** (optional, for testing)
   - **Webhooks** (for lead ads)

### 1.2 Configure WhatsApp Product

1. In your app dashboard, click "WhatsApp" → "Getting Started"
2. Select a test phone number (sandbox number provided by Meta)
3. Note down:
   - **WhatsApp Phone Number ID** (from the dashboard)
   - **WhatsApp Access Token** (generate temporary token for testing)
4. Add your phone number to the "To" list in WhatsApp settings to receive test messages

### 1.3 Configure Webhooks

1. In your app dashboard, click "Webhooks" → "Setup Webhooks"
2. Set your Callback URL: `https://your-domain.com/api/meta/facebook/webhook`
   - For local dev: use ngrok (see below)
3. Set Verify Token: use the same value as `META_VERIFY_TOKEN` in `.env.local`
4. Subscribe to webhook fields:
   - **Lead Ads** (for Facebook/Instagram)
   - **Messages** (for WhatsApp)

---

## Phase 2: Facebook + Instagram Lead Ads Setup

### 2.1 Subscribe Test Page to Lead Ads Webhook

1. Get your Test Page ID from Facebook Page settings
2. Use Graph API to subscribe the page:

```bash
curl -X POST \
  "https://graph.facebook.com/v23.0/{PAGE_ID}/subscribed_apps" \
  -d "access_token={PAGE_ACCESS_TOKEN}" \
  -d "subscribed_fields=leadgen"
```

Response should show success with your app ID.

### 2.2 Connect Instagram to Test Page

1. Go to your Test Page settings
2. Click "Instagram" → "Connect Account"
3. Select your test Instagram Business Account
4. Instagram Lead Ads will now use the same webhook subscription as the parent Page

### 2.3 Create Test Lead Form

1. Go to Facebook Ads Manager
2. Create a new Lead Ad campaign (test mode)
3. Design your lead form with fields:
   - Full Name
   - Email
   - Phone Number
   - Custom fields (optional)
4. Set the placement to Facebook + Instagram
5. **Important:** Use "Lead Ads Testing Tool" (no ad spend required)

---

## Phase 3: WhatsApp Sandbox Setup

### 3.1 Configure WhatsApp Webhook

1. In your app dashboard, click "WhatsApp" → "Configuration"
2. Set Webhook URL: `https://your-domain.com/api/meta/whatsapp/webhook`
3. Set Verify Token: use `WHATSAPP_VERIFY_TOKEN` from `.env.local`
4. Subscribe to webhook fields:
   - `messages` (for inbound messages)

### 3.2 Test WhatsApp Messaging

1. Add your personal phone number to the WhatsApp sandbox "To" list
2. Send a test message to the sandbox WhatsApp number
3. Check CRM - a new Lead should appear with `source = "WhatsApp"`

---

## Phase 4: Local Development with ngrok

### 4.1 Install ngrok

```bash
# Windows (using chocolatey)
choco install ngrok

# Or download from https://ngrok.com/download
```

### 4.2 Start ngrok Tunnel

```bash
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`

### 4.3 Update Webhook URLs

Use ngrok URL for Meta webhooks:
- Facebook: `https://abc123.ngrok.io/api/meta/facebook/webhook`
- WhatsApp: `https://abc123.ngrok.io/api/meta/whatsapp/webhook`

---

## Phase 5: End-to-End Testing

### Test 1: Facebook Lead Ads

1. Use Meta's "Lead Ads Testing Tool"
2. Submit a test lead with:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "9876543210"
3. Verify in CRM:
   - Lead appears in New Leads view
   - `leadSource = "Facebook"`
   - Phone normalized to E.164 format (+919876543210)
   - Assigned to a sales executive
   - Raw payload stored in `sourceMeta`

### Test 2: Instagram Lead Ads

1. Use the same Lead Ads Testing Tool
2. Set placement to Instagram
3. Submit test lead
4. Verify in CRM:
   - Lead appears with `leadSource = "Instagram"`
   - Same duplicate detection as Facebook

### Test 3: Duplicate Detection

1. Submit the same test lead twice (same email/phone)
2. Verify second submission is rejected with duplicate error
3. Check `WebhookLog` table - status should be "duplicate-skipped"

### Test 4: WhatsApp First Contact

1. Send a WhatsApp message from your phone to sandbox number
2. Verify in CRM:
   - New Lead created with `leadSource = "WhatsApp"`
   - `sourceMeta` contains raw WhatsApp payload
   - Activity entry created for the message
   - Assigned to sales executive

### Test 5: WhatsApp Ongoing Conversation

1. Send a second message from the same phone number
2. Verify in CRM:
   - NO new Lead created
   - New Activity entry added under existing Lead
   - Message ID stored in `agenda` field for dedup

### Test 6: Cross-Source Deduplication

1. Create a Lead via Facebook Lead Ads with phone +919876543210
2. Send a WhatsApp message from the same phone number
3. Verify:
   - WhatsApp message attaches to existing Facebook Lead
   - No duplicate Lead created
   - Activity added to existing Lead

---

## Phase 6: Production Migration Checklist

When moving from sandbox to production:

### Meta App Review

1. Submit your app for App Review
2. Request permissions:
   - `leads_retrieval` (for Lead Ads)
   - `whatsapp_business_messaging` (for WhatsApp)
3. Complete Business Verification (required for WhatsApp)

### Business Verification Requirements

- Business documents (registration, tax ID)
- Website verification
- Phone verification
- Business email verification

### Token Regeneration

1. Generate permanent Page Access Token (never expires)
2. Generate permanent WhatsApp Access Token
3. Update `.env.production` with new tokens
4. **Never commit production tokens to git**

### Webhook URL Update

1. Update webhook URLs to production domain
2. Remove ngrok from setup
3. Ensure HTTPS is valid (SSL certificate)

### Monitoring

1. Monitor `WebhookLog` table for failed events
2. Set up alerts for high failure rates
3. Regular audit of duplicate-skipped events

---

## Troubleshooting

### Webhook Verification Fails

- Check `META_VERIFY_TOKEN` matches in both Meta dashboard and `.env.local`
- Ensure webhook URL is publicly accessible (ngrok is running)
- Check server logs for verification errors

### Lead Not Created

- Check `WebhookLog` table for error messages
- Verify Graph API access token is valid
- Check duplicate detection logic (email/phone already exists)
- Verify assignment logic has active users

### WhatsApp Messages Not Received

- Verify phone number is in WhatsApp sandbox "To" list
- Check WhatsApp webhook subscription is active
- Verify `WHATSAPP_ACCESS_TOKEN` is valid
- Check message dedup (same message ID)

### Phone Normalization Issues

- Check phone format in source data
- Verify default country code (currently set to "91" for India)
- Test with various phone formats in `utils/phoneNormalization.ts`

---

## API Endpoints

### Facebook/Instagram Webhook
- **GET/POST** `/api/meta/facebook/webhook`
- Handles Lead Ads webhooks from both platforms

### WhatsApp Webhook
- **GET/POST** `/api/meta/whatsapp/webhook`
- Handles inbound WhatsApp messages

### WebhookLog Query (for debugging)
```sql
SELECT * FROM WebhookLog 
WHERE source = 'whatsapp' 
AND status = 'failed' 
ORDER BY receivedAt DESC;
```

---

## Architecture Summary

```
Meta (Facebook/Instagram/WhatsApp)
    ↓ Webhook
/api/meta/{platform}/webhook
    ↓
{metaLeadIngestionService, whatsappMessageService}
    ↓
Shared Services:
  - leadAssignmentService (workload-based assignment)
  - phoneNormalization (E.164 format)
  - webhookLoggingService (audit trail)
    ↓
Existing Lead Table (no new tables)
    ↓
CommunicationLog (for WhatsApp Activity)
```

**Key Design Decision:** All Meta leads go into the EXISTING Lead table with shared duplicate detection and assignment logic. No separate FacebookLead or WhatsAppLead tables.
