# Variant 2 — Professional CRM: Master AI Prompts
> Role: AI Prompt Engineer
> Purpose: Ready-to-use prompts for each development phase. Paste the SYSTEM CONTEXT first, then the phase-specific prompt into your AI coding agent.

---

## ⚙️ SYSTEM CONTEXT PROMPT
> **Prepend this to EVERY phase prompt before sending to your AI agent.**

```
You are a senior full-stack engineer building VARIANT 2 — PROFESSIONAL CRM for a manufacturing B2B company.

PRODUCT CONTEXT:
- Industry: Manufacturing (industrial products — bearings, pumps, valves, machinery)
- Sales cycle: Lead → Qualify → Convert → Opportunity → RFQ → Costing → Quotation → Won
- 13 modules: Dashboard, Leads, Accounts, Contacts, Activities, Tasks, Follow Ups, Customer Visits, Product Catalogue, Sales Pipeline, RFQ Management, Quotation Management, Reports, Settings

TECH STACK (this project):
- Framework: Next.js 14+ (App Router)
- Database: SQL Server via Prisma ORM
- Auth: JWT-based sessions
- UI: Tailwind CSS + existing shared components
- Language: TypeScript

ABSOLUTE RULES — NEVER BREAK THESE:
1. All monetary totals (grand_total, subtotal, tax_amount) are ALWAYS server-computed. Never trust client-sent totals.
2. Every status/stage change MUST insert a history record (lead_status_history, opportunity_stage_history, etc.)
3. Every sensitive operation MUST insert an audit_log record (who, what, when, old value, new value)
4. Permission middleware runs on EVERY API route — check role_permission table, not hardcoded role names
5. Polymorphic FKs (related_to_type + related_to_id) must validate the related record exists before insert
6. Nightly batch jobs handle: Overdue leads/tasks/follow-ups/visits, Expired quotations, Inactive accounts
7. Notification triggers are non-blocking — fire and forget; insert into notification_log, do not delay the main response
8. On Lead Convert: use a DB transaction — all 3 records (account + contact + opportunity) created atomically or none
9. On Quotation Accept: use a DB transaction — cascade to opportunity=Won, account=Active, RFQ=Closed, follow_ups=Cancelled
10. Row-level security on all report queries: Sales Executive sees own data only; Manager sees territory; Admin sees all

EXISTING CODEBASE STATE:
- Navigation shell and routing: EXISTS
- Auth/JWT middleware: BUILT in Phase 1
- Shared UI components (tables, modals, forms, badges): REUSE, do not rebuild
- Database: all tables created in Phase 1 migrations
- Do not reinstall packages already in package.json
```

---

## 📦 PHASE 1 — Foundation & Database
**Deadline:** June 23 | **Priority:** 🔴 Critical

```
[PASTE SYSTEM CONTEXT ABOVE FIRST]

You are implementing PHASE 1 — FOUNDATION & DATABASE of the Professional CRM.
Nothing exists yet. Build the complete database layer, auth system, and Settings module.

═══════════════════════════════════════════════════
TASK 1 — DATABASE MIGRATIONS (run in this exact order)
═══════════════════════════════════════════════════
Run Prisma migrations in dependency order:

BATCH 1 (no FKs): users, roles
BATCH 2 (master data): territory, lead_source_master, pipeline_stage_master, loss_reason_master, tax_master, product_category
BATCH 3 (core feature tables): lead, account, contact, opportunity, rfq, quotation, activity, task, follow_up, customer_visit, product, product_specification, product_document, lead_activity_log, lead_qualification_checklist, opportunity_line_item, opportunity_stage_history, rfq_line_item, rfq_costing_sheet, quotation_line_item, quotation_approval, report_definition, report_schedule, report_export_log, dashboard_widget_config, dashboard_user_preference, sales_target
BATCH 4 (gap-fill): communication_template, document, custom_field_definition, custom_field_value, user_session
BATCH 5 (junctions): opportunity_contact, visit_attendee, activity_attendee, permission_master, role_permission, product_alternate, report_role_access
BATCH 6 (audit): audit_log, login_audit, approval_audit_log
BATCH 7 (history): lead_status_history, account_status_history, rfq_status_history, quotation_status_history, quotation_revision_snapshot, product_price_history, account_credit_history
BATCH 8 (engagement): quotation_view_log, call_recording, whatsapp_message_log, document_view_log
BATCH 9 (notifications): notification_log, notification_outbox, user_notification_preference

═══════════════════════════════════════════════════
TASK 2 — SEED DATA
═══════════════════════════════════════════════════
Insert into Prisma seed file (prisma/seed.ts):

Roles (5): Sales Executive, Sales Manager, Telecaller, Admin, Finance
  - permission_set: JSON with module×action matrix
  - is_system_role: true for all 5

Lead Sources (5): Website, Referral, Trade Show, Cold Call, Tender Portal

Pipeline Stages (7) with display_order and default_probability_percent:
  1. Qualified = 20%
  2. Requirement Gathering = 35%
  3. Technical Discussion = 50%
  4. Meeting Scheduled = 60%
  5. Demo Conducted = 70%
  6. Won = 100%
  7. Lost = 0%

Loss Reasons (10): Price Too High, Lost to Competitor, No Budget, Requirement Mismatch,
  No Response, Project Cancelled, Long Decision Cycle, Technical Gap, Relationship Issue, Other

Tax Master (5): GST 5%, GST 12%, GST 18%, GST 28%, IGST 18%

Permission Master: insert rows for each module × action combination
  Modules: Lead, Account, Contact, Opportunity, RFQ, Quotation, Activity, Task, FollowUp,
           CustomerVisit, Product, Report, Settings, Dashboard
  Actions: View, Create, Edit, Delete, Approve, Export

Default role_permission matrix:
  Sales Executive: View+Create+Edit on Lead/Account/Contact/Opportunity/RFQ/Activity/Task/FollowUp/CustomerVisit
  Sales Manager: All of above + Approve on Quotation + View on Reports + Edit on all
  Finance: View+Edit on Account (credit_limit only), Approve on Quotation
  Admin: ALL permissions
  Telecaller: View+Create+Edit on Lead, View on Account/Contact

═══════════════════════════════════════════════════
TASK 3 — AUTH APIS
═══════════════════════════════════════════════════
POST /api/auth/login:
  - Validate email + password (bcrypt compare)
  - On success: INSERT user_session (user_id, login_at, ip_address, device_type)
  - Return JWT payload: { user_id, role_id, role_name, permission_set, territory_id }
  - On failure: INSERT login_audit (attempted_email, user_id or null, status='Failed - Wrong Password', ip_address)
  - After 5 consecutive failures for same email within 1 hour: set user.is_active=false; INSERT notification_log to Admin

POST /api/auth/logout:
  - Verify JWT
  - UPDATE user_session SET logout_at=NOW() WHERE user_id=:id AND logout_at IS NULL

GET /api/auth/me:
  - Return user profile + role + permissions from JWT (no DB hit needed unless stale)

MIDDLEWARE — authMiddleware:
  - Extract Bearer token from Authorization header
  - Verify JWT signature + expiry
  - Check user.is_active = true (DB check on each request)
  - Attach user to request context

MIDDLEWARE — permissionMiddleware(module, action):
  - Query: SELECT is_granted FROM role_permission rp JOIN permission_master pm ON rp.permission_id=pm.permission_id WHERE rp.role_id=:role_id AND pm.module_name=:module AND pm.action_name=:action AND rp.is_granted=true
  - If not found: return 403 { error: 'Insufficient permissions', required: module+':'+action }

═══════════════════════════════════════════════════
TASK 4 — SETTINGS MODULE APIS
═══════════════════════════════════════════════════
All routes require authMiddleware + permissionMiddleware('Settings', 'View'/'Edit')

GET/POST/PUT/DELETE /api/settings/users
  - POST: hash password with bcrypt; generate temp password; send email invite
  - PUT (deactivate): set is_active=false; UPDATE user_session SET is_forced_logout=true WHERE user_id=:id AND logout_at IS NULL; reassign open leads+opportunities to reporting_manager_id

GET/POST/PUT /api/settings/roles
  - Cannot delete role assigned to active users (check user count)
  - PUT: save to role_permission junction (delete existing rows, re-insert from matrix)

GET/POST/PUT/DELETE /api/settings/territories
GET/POST/PUT/DELETE /api/settings/lead-sources
GET/POST/PUT/DELETE /api/settings/pipeline-stages (include drag-reorder: PUT /bulk-order with array of {id, display_order})
GET/POST/PUT/DELETE /api/settings/loss-reasons
GET/POST/PUT/DELETE /api/settings/tax-master

═══════════════════════════════════════════════════
TASK 5 — SETTINGS FRONTEND SCREENS
═══════════════════════════════════════════════════
Reuse existing table/modal/form components.

Users List page:
  - Table: Name, Email, Role, Territory, Status (Active/Inactive toggle), Last Login, Actions
  - Actions: Edit, Reset Password, Deactivate
  - Filter: Role, Status, Territory

Add/Edit User modal:
  - Fields: full_name, email, phone, role_id (dropdown), territory_id (dropdown), reporting_manager_id (dropdown — show only active users), is_active toggle

Roles & Permissions page:
  - Matrix grid: rows = modules, columns = View/Create/Edit/Delete/Approve/Export
  - Each cell = checkbox
  - Save saves entire matrix to role_permission table

Other master tables (simple list + modal pattern):
  - Lead Sources: name, is_active toggle
  - Pipeline Stages: name, default_probability%, display_order (drag handle to reorder)
  - Loss Reasons: reason_text, applies_to_module dropdown, is_active
  - Tax Master: tax_name, tax_percent, hsn_code, effective_from date, is_active

═══════════════════════════════════════════════════
ACCEPTANCE CRITERIA (all must pass before Phase 2)
═══════════════════════════════════════════════════
✓ All 65+ tables created with FK integrity (run: SELECT * FROM information_schema.TABLE_CONSTRAINTS)
✓ Seed data present — 5 roles, 7 pipeline stages, 5 lead sources, 10 loss reasons, 5 tax rates
✓ POST /api/auth/login returns JWT with role+permissions in payload
✓ GET /api/auth/me returns correct user profile
✓ Sales Executive hitting GET /api/settings/roles → 403
✓ Admin hitting GET /api/settings/roles → 200
✓ User deactivation: token of deactivated user rejected on next API call
✓ All Settings CRUD screens load and save without errors
```

---

## 👥 PHASE 2 — Leads Module
**Deadline:** June 24 | **Priority:** 🔴 Critical

```
[PASTE SYSTEM CONTEXT ABOVE FIRST]

You are implementing PHASE 2 — LEADS MODULE. This is the entry point for all sales activity.

KEY BUSINESS RULES:
- Lead code format: LD-YYYY-NNNNN (e.g., LD-2026-00001)
- Lead status flow: New → Contacted → SQL → Converted | Lost | Overdue | Duplicate
- SQL (Sales Qualified Lead) requires completed BANT checklist before transition
- Convert is ATOMIC: creates account + contact + opportunity or nothing

═══════════════════════════════════════════════════
TASK 1 — BACKEND APIS
═══════════════════════════════════════════════════
GET /api/leads:
  Pagination: page, limit (default 25)
  Filters: status, lead_source_id, industry_type, territory_id, assigned_to, date_from, date_to, lead_score_min, lead_score_max, search (company_name/contact_person/phone/email)
  Sub-views via ?view= param: new, today_followup, sql, overdue, lost, duplicate
  Row-level security: if role=Sales Executive → WHERE assigned_to=current_user_id

POST /api/leads:
  Validation:
    - phone OR email required (not both optional)
    - phone: 10 digits or +CC format
    - email: RFC format if provided
    - estimated_value: positive number if provided
    - assigned_to user must be is_active=true
  On success:
    1. Generate lead_code = 'LD-' + YEAR + '-' + LPAD(next_seq, 5, '0')
    2. Territory-based assignment: find Sales Executive with territory matching lead.territory_id; fallback round-robin among active Sales Executives
    3. Calculate lead_score (see scoring algorithm below)
    4. INSERT follow_up (type=Call, scheduled_datetime=next_business_day_9am, purpose_notes='Initial contact call', assigned_to=same as lead)
    5. INSERT notification_log to assigned user: 'New lead assigned: [company_name]'
    6. INSERT lead_status_history (from_status=NULL, to_status='New')

LEAD SCORE ALGORITHM (0-100, server-computed):
  industry_fit:       Automotive/Pharma/Textile = 25pts, Others = 10pts
  source_quality:     Referral=20, Trade Show=18, Website=15, Cold Call=10, Other=5
  designation_seniority: contains(Head|Director|VP|GM|President|CEO|MD) = 20pts, Manager = 15pts, Engineer/Executive = 10pts
  estimated_value:    >10L(1000000)=20, 1L-10L=15, <1L=10, null=0
  contact_completeness: has_email AND has_phone = 15pts; has_one = 7pts; neither = 0pts
  Sum, cap at 100.

DUPLICATE DETECTION (run on POST + PUT):
  Check: existing lead WHERE phone = :phone (exact)
         OR (SOUNDEX(company_name) = SOUNDEX(:company_name) AND territory_id = :territory_id)
  If match: set lead.is_duplicate_of = matched_lead_id; lead_status = 'Duplicate'
  INSERT notification_log to assigned_to: 'Potential duplicate lead detected'
  Do NOT auto-merge, do NOT block creation.

PUT /api/leads/:id:
  On status change: INSERT lead_status_history; INSERT audit_log
  Recalculate lead_score if scoring fields changed

POST /api/leads/:id/qualify:
  Body: { has_budget, has_authority, has_need, timeline_months }
  Validate: all 4 fields present; has_budget=true AND has_authority=true AND has_need=true required
  INSERT lead_qualification_checklist
  UPDATE lead SET lead_status='SQL'
  INSERT lead_status_history
  INSERT notification_log to Sales Manager: 'Lead [code] qualified as SQL'

POST /api/leads/:id/convert:
  IN A DB TRANSACTION:
  Body: { account: {...}, contact: {...}, opportunity: {...} }
  1. Validate GSTIN format if provided: regex /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
  2. CREATE account (generate ACC-NNNNN code)
  3. CREATE contact (link to new account_id)
  4. CREATE opportunity (stage='Qualified', probability_percent=20 from pipeline_stage_master, generate OPP-YYYY-NNNNN code)
  5. UPDATE lead SET converted_account_id=:accountId, converted_opportunity_id=:oppId, lead_status='Converted'
  6. INSERT lead_status_history
  7. INSERT opportunity_stage_history (initial stage)
  8. Return { account_id, contact_id, opportunity_id }
  If ANY step fails: ROLLBACK entire transaction

POST /api/leads/:id/mark-lost:
  Require: lost_reason_id (FK to loss_reason_master) — 400 if missing
  UPDATE lead SET lead_status='Lost', lost_reason_id=:id
  INSERT lead_status_history
  UPDATE follow_up SET followup_status='Cancelled' WHERE related_to_type='Lead' AND related_to_id=:id AND followup_status IN ('Pending','Overdue')

POST /api/leads/:id/log-activity:
  INSERT lead_activity_log (activity_type, notes, direction if call, outcome if call, logged_by, logged_at)
  If activity_type='Call' AND outcome='Connected' AND lead.lead_status='New':
    UPDATE lead SET lead_status='Contacted'
    INSERT lead_status_history

NIGHTLY BATCH (cron/scheduler):
  UPDATE lead SET lead_status='Overdue'
  WHERE lead_status IN ('New','Contacted')
  AND next_followup_date < CURDATE()
  AND converted_account_id IS NULL
  → For each updated lead: INSERT lead_status_history; INSERT notification_log to assigned_to

═══════════════════════════════════════════════════
TASK 2 — FRONTEND SCREENS
═══════════════════════════════════════════════════
Leads List View:
  Tab bar: All Leads | New | Today's Follow Up | SQL | Overdue | Lost | Duplicate
  Table columns: Lead Code, Company, Contact Person, Phone, Source, Score (colored badge 0-100), Status (colored pill), Assigned To, Next Follow Up Date, Actions
  Score badge colors: 0-40=red, 41-70=amber, 71-100=green
  Status pill colors: New=blue, Contacted=indigo, SQL=purple, Overdue=red, Lost=gray, Converted=green, Duplicate=yellow
  Row actions: View, Edit, Log Activity, Convert (if SQL), Mark Lost, Mark Duplicate
  Bulk action bar (on row selection): Reassign | Change Status | Mark Lost | Export CSV
  Filter panel (collapsible): Status, Source, Industry, Territory, Assigned To, Date Range, Score Range

Lead Detail View (tabs):
  Tab 1 — Overview: all lead fields in 2-column editable grid
  Tab 2 — Activity Timeline: <TimelineComponent /> showing lead_activity_log entries + quick-log bar
  Tab 3 — BANT Checklist: 4 checkboxes (Budget/Authority/Need/Timeline months input); Save + "Qualify as SQL" button (disabled until all 4 complete)
  Tab 4 — Documents: file upload + list

Convert Lead Modal (3-section accordion):
  Section 1 — Account: company_name (pre-filled), gst_number, account_type, industry_type, billing_address
  Section 2 — Contact: full_name (pre-filled), designation (pre-filled), email (pre-filled), phone (pre-filled), contact_category dropdown
  Section 3 — Opportunity: opportunity_name (auto: "Supply - [company_name]"), estimated_value (pre-filled), expected_close_date picker
  Submit: "Convert Lead" button — shows loading, then redirects to new Opportunity on success
```

---

## 🏢 PHASE 3 — Accounts & Contacts
**Deadline:** June 24-25 | **Priority:** 🔴 Critical

```
[PASTE SYSTEM CONTEXT ABOVE FIRST]

You are implementing PHASE 3 — ACCOUNTS & CONTACTS.

KEY BUSINESS RULES:
- GST number must be unique (15-char GSTIN format)
- Account code format: ACC-NNNNN
- Contact must always link to an account
- Only one primary contact per account (auto-unset previous on new primary)
- Credit limit changes require Finance role (permissionMiddleware('Account','ApproveCreditLimit'))
- Account cannot be marked Inactive if it has open Opportunity or pending RFQ/Quotation

═══════════════════════════════════════════════════
TASK 1 — ACCOUNTS API
═══════════════════════════════════════════════════
POST /api/accounts:
  GSTIN validation regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
  Check GSTIN uniqueness (if provided)
  Generate account_code = 'ACC-' + LPAD(next_seq, 5, '0')
  INSERT account_status_history (initial status)
  INSERT audit_log

PUT /api/accounts/:id:
  If credit_limit or credit_terms_days changed: require Finance role → INSERT account_credit_history (old_credit_limit, new_credit_limit, old_credit_terms_days, new_credit_terms_days, approved_by)
  If account_status changed: validate (cannot set Inactive if open opportunities/RFQs/quotations exist) → INSERT account_status_history
  INSERT audit_log for each changed field (field_name, old_value, new_value)

GET /api/accounts/:id:
  Return account + counts: { contacts_count, open_opportunities_count, quotations_count, rfqs_count, visits_count }

Sub-routes:
  GET/POST/PUT/DELETE /api/accounts/:id/plant-locations
  POST /api/accounts/:id/documents (multipart upload → INSERT document table)
  GET /api/accounts/:id/contacts
  GET /api/accounts/:id/opportunities
  GET /api/accounts/:id/quotations
  GET /api/accounts/:id/rfqs
  GET /api/accounts/:id/visits
  GET /api/accounts/:id/activities (timeline)

═══════════════════════════════════════════════════
TASK 2 — CONTACTS API
═══════════════════════════════════════════════════
POST /api/contacts:
  Require account_id (validate account exists and is active)
  Auto-suggest is_decision_maker=true if designation contains: Head|Director|VP|GM|President|CEO|MD

PUT /api/contacts/:id:
  If is_primary_contact=true: first UPDATE contact SET is_primary_contact=false WHERE account_id=same AND contact_id != :id

DELETE /api/contacts/:id:
  Check: no active quotation.contact_id = :id AND no active rfq.contact_id = :id
  If references exist: return 409 { error: 'Reassign contact from active quotations/RFQs before deleting', count: N }

═══════════════════════════════════════════════════
TASK 3 — NIGHTLY BATCH
═══════════════════════════════════════════════════
Mark accounts Inactive if no activity in 365 days:
  SELECT account_id FROM account WHERE account_status NOT IN ('Inactive','Lost')
  AND account_id NOT IN (
    SELECT account_id FROM opportunity WHERE stage NOT IN ('Won','Lost')
    UNION SELECT account_id FROM rfq WHERE rfq_status != 'Closed'
    UNION SELECT account_id FROM quotation WHERE quotation_status NOT IN ('Accepted','Rejected','Expired','Cancelled')
  )
  AND last_activity_date < DATE_SUB(NOW(), INTERVAL 365 DAY)
  → UPDATE account_status='Inactive'; INSERT account_status_history for each

Birthday reminder (nightly):
  SELECT c.*, u.user_id FROM contact c JOIN account a ON c.account_id=a.account_id JOIN users u ON a.assigned_sales_owner=u.user_id
  WHERE MONTH(c.birthday)=MONTH(NOW()) AND DAY(c.birthday)=DAY(NOW())
  → INSERT notification_log to assigned_sales_owner: 'Birthday today: [contact_name] at [account_name]'

═══════════════════════════════════════════════════
TASK 4 — ACCOUNT 360° DETAIL VIEW (Frontend)
═══════════════════════════════════════════════════
Layout: 8-tab detail page. Header shows: account_name, account_code badge, status pill, key_account star badge, territory.

Tab 1 — Overview: 2-column grid of all account fields. Key Account toggle (Admin/Manager only). Assigned Sales Owner with avatar.
Tab 2 — Contacts: cards showing name, designation, category badge (Technical=blue/Purchase=green/Finance=purple), primary badge, is_decision_maker crown icon. "Add Contact" button.
Tab 3 — Opportunities: table (Stage, Opportunity Name, Value, Probability, Expected Close, Progress bar by stage)
Tab 4 — Quotations: table (Quote#, Status pill, Grand Total, Validity, PDF download)
Tab 5 — RFQs: table (RFQ#, Priority badge, Status, Customer Due Date, Costing Owner)
Tab 6 — Visits: timeline cards (date, purpose badge, status, executive, summary preview)
Tab 7 — Documents: upload dropzone + file list (type icon, name, date, download)
Tab 8 — Activity Timeline: <TimelineComponent relatedType="Account" relatedId={id} />

Right sidebar (sticky): Credit Info card (credit_limit, terms — Finance editable only), Territory, Sales Owner, Created date.
```
