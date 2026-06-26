# Phase 2 — Leads Module
**Deadline:** June 24 | **Priority:** 🔴 Critical

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 2 — LEADS MODULE. Entry point for all sales activity.

KEY RULES:
- Lead code: LD-YYYY-NNNNN
- Status flow: New → Contacted → SQL → Converted | Lost | Overdue | Duplicate
- SQL transition requires completed BANT checklist
- Convert is ATOMIC (DB transaction): account + contact + opportunity or nothing
- Duplicate detection on phone match OR fuzzy company name in same territory

══════════════════════════════════════════
TASK 1 — BACKEND APIS
══════════════════════════════════════════
GET /api/leads:
  Pagination: page, limit=25
  Filters: status, lead_source_id, industry_type, territory_id, assigned_to, date_from, date_to,
           lead_score_min, lead_score_max, search (company_name/contact_person/phone/email)
  Sub-views ?view=: new | today_followup | sql | overdue | lost | duplicate
  Row-level security: Sales Executive → WHERE assigned_to=current_user_id

POST /api/leads:
  Validation:
    - phone OR email required
    - phone: 10 digits or +CC format
    - estimated_value: positive if provided
    - assigned_to must be is_active=true user
  On success (in order):
    1. lead_code = 'LD-' + YEAR + '-' + LPAD(next_seq, 5, '0')
    2. Assign by territory pincode mapping; fallback = round-robin active Sales Executives
    3. Calculate lead_score (algorithm below)
    4. INSERT follow_up (type=Call, scheduled=next_business_day_9am, assigned_to=same as lead)
    5. INSERT notification_log to assigned_to: 'New lead assigned: [company_name]'
    6. INSERT lead_status_history (from=NULL, to='New')
    7. Run duplicate detection (non-blocking)

LEAD SCORE ALGORITHM (server-computed, 0–100):
  industry_fit:    Automotive/Pharma/Textile = 25pts | Others = 10pts
  source_quality:  Referral=20 | Trade Show=18 | Website=15 | Cold Call=10 | Other=5
  designation:     Head/Director/VP/GM/CEO/MD/President = 20 | Manager = 15 | Engineer/Exec = 10
  value_bucket:    >10L = 20 | 1L–10L = 15 | <1L = 10 | null = 0
  contact_data:    email AND phone = 15 | either = 7 | neither = 0
  Total capped at 100

DUPLICATE DETECTION (run on POST + PUT, non-blocking):
  Match if: phone = :phone (exact)
    OR SOUNDEX(company_name) = SOUNDEX(:company_name) AND territory_id = :territory_id
  If match: lead.is_duplicate_of = matched_lead_id; lead_status = 'Duplicate'
  INSERT notification_log to assigned_to: 'Potential duplicate detected'
  Do NOT block creation, do NOT auto-merge

PUT /api/leads/:id:
  On status change: INSERT lead_status_history; INSERT audit_log
  Recalculate lead_score if scoring fields changed

POST /api/leads/:id/qualify:
  Body: { has_budget, has_authority, has_need, timeline_months }
  Validate: all 4 required; has_budget AND has_authority AND has_need must be true
  INSERT lead_qualification_checklist
  UPDATE lead.lead_status = 'SQL'
  INSERT lead_status_history
  INSERT notification_log to Sales Manager: 'Lead [code] qualified as SQL'

POST /api/leads/:id/convert (DB TRANSACTION):
  Body: { account:{...}, contact:{...}, opportunity:{...} }
  1. GSTIN validation if provided: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
  2. CREATE account (code = 'ACC-' + LPAD(seq,5,'0'))
  3. CREATE contact (link to new account_id)
  4. CREATE opportunity (code = 'OPP-YYYY-NNNNN', stage='Qualified', probability=20%)
  5. UPDATE lead SET converted_account_id, converted_opportunity_id, lead_status='Converted'
  6. INSERT lead_status_history + opportunity_stage_history (initial)
  7. Return { account_id, contact_id, opportunity_id }
  ROLLBACK ALL if any step fails

POST /api/leads/:id/mark-lost:
  Require lost_reason_id (400 if missing)
  UPDATE lead + INSERT lead_status_history
  Bulk-cancel open follow_ups for this lead

POST /api/leads/:id/log-activity:
  INSERT lead_activity_log
  If type='Call' AND outcome='Connected' AND current_status='New':
    UPDATE lead.lead_status='Contacted'; INSERT lead_status_history

NIGHTLY BATCH:
  UPDATE lead.lead_status='Overdue'
  WHERE lead_status IN ('New','Contacted') AND next_followup_date < CURDATE()
  AND converted_account_id IS NULL
  For each: INSERT lead_status_history; notify assigned_to

══════════════════════════════════════════
TASK 2 — FRONTEND SCREENS
══════════════════════════════════════════
Leads List:
  Tabs: All Leads | New | Today's Follow Up | SQL | Overdue | Lost | Duplicate
  Columns: Lead Code, Company, Contact, Phone, Source, Score badge (0-40=red/41-70=amber/71-100=green),
           Status pill, Assigned To, Next Follow Up, Actions
  Row actions: View, Edit, Log Activity, Convert (if SQL), Mark Lost, Mark Duplicate
  Bulk bar: Reassign | Change Status | Mark Lost | Export CSV
  Filter panel: Status, Source, Industry, Territory, Assigned To, Date Range, Score range

Lead Detail (4 tabs):
  Tab 1 — Overview: all fields in 2-column editable grid
  Tab 2 — Activity Timeline: <TimelineComponent relatedType="Lead" relatedId={id} />
           + quick log bar at top with Call/Email/WhatsApp/Note icons
  Tab 3 — BANT Checklist:
           4 checkboxes: Budget ☐ | Authority ☐ | Need ☐ | Timeline (months input)
           "Qualify as SQL" button — disabled until all 4 checked/filled
  Tab 4 — Documents: upload + file list

Convert Lead Modal (3-section accordion):
  Section 1 — Account: company_name (pre-filled), gst_number, account_type dropdown, industry_type, billing_address
  Section 2 — Contact: full_name (pre-filled), designation (pre-filled), email (pre-filled), phone (pre-filled), contact_category
  Section 3 — Opportunity: opportunity_name (auto: "Supply - [company]"), estimated_value (pre-filled), expected_close_date
  Button: "Convert Lead" → loading state → redirect to new Opportunity on success

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ All 7 sub-view tabs return correctly filtered leads
✓ lead_code generated in LD-YYYY-NNNNN format
✓ Territory-based auto-assignment works
✓ lead_score 0–100 calculated on create/update
✓ First follow_up auto-created on lead creation
✓ BANT checklist gates SQL transition
✓ Convert creates all 3 records atomically (all or nothing)
✓ Mark Lost requires loss reason from dropdown
✓ Duplicate detection fires on matching phone
✓ Bulk actions work on selected rows
✓ Status history recorded on every transition
```
