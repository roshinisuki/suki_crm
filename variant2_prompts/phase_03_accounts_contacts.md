# Phase 3 — Accounts & Contacts
**Deadline:** June 24–25 | **Priority:** 🔴 Critical

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 3 — ACCOUNTS & CONTACTS. Master entity layer all transactions depend on.

KEY RULES:
- Account code: ACC-NNNNN
- GSTIN unique (15-char format) — optional but unique if provided
- Contact MUST link to an account
- Only ONE primary contact per account (auto-unset old primary when new one set)
- Credit limit changes: Finance role only → INSERT account_credit_history
- Cannot mark Inactive if open Opportunity or pending RFQ/Quotation exists

══════════════════════════════════════════
TASK 1 — ACCOUNTS API
══════════════════════════════════════════
POST /api/accounts:
  Validate GSTIN if provided: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
  Check GSTIN uniqueness
  Generate account_code = 'ACC-' + LPAD(seq, 5, '0')
  INSERT account_status_history (initial status='Prospect')
  INSERT audit_log

GET /api/accounts/:id:
  Return account + related counts:
  { contacts_count, open_opportunities_count, quotations_count, rfqs_count, visits_count }

PUT /api/accounts/:id:
  If credit_limit OR credit_terms_days changed:
    Require permissionMiddleware('Account','ApproveCreditLimit') — Finance/Admin only
    INSERT account_credit_history (old_credit_limit, new_credit_limit, old_terms, new_terms, approved_by)
  If account_status changed to 'Inactive':
    Validate: no open opportunities (stage NOT IN Won/Lost) AND no pending RFQ/Quotation
    If blocked: 400 { error: 'Cannot deactivate account with open deals' }
  INSERT account_status_history on status change
  INSERT audit_log for each changed field (field_name, old_value, new_value)

Sub-routes for account detail:
  GET/POST/PUT/DELETE /api/accounts/:id/plant-locations
  POST /api/accounts/:id/documents
    (multipart upload → INSERT into document table: related_to_type='Account', related_to_id=:id)
  GET /api/accounts/:id/contacts
  GET /api/accounts/:id/opportunities
  GET /api/accounts/:id/quotations
  GET /api/accounts/:id/rfqs
  GET /api/accounts/:id/visits
  GET /api/accounts/:id/activities   ← timeline

POST /api/accounts/merge (Admin only):
  Reassign all FK references (contacts, opportunities, rfqs, quotations, visits, activities)
  from source_account_id to target_account_id
  Soft-delete source account

══════════════════════════════════════════
TASK 2 — CONTACTS API
══════════════════════════════════════════
POST /api/contacts:
  Require account_id and validate account exists and is_active
  Auto-set is_decision_maker=true if designation contains:
    Head|Director|VP|GM|President|CEO|MD|CTO|COO (case-insensitive)

PUT /api/contacts/:id:
  If is_primary_contact=true:
    UPDATE contact SET is_primary_contact=false
    WHERE account_id=:account_id AND contact_id != :id
    (Ensures only one primary per account)

DELETE /api/contacts/:id:
  Check: no quotation.contact_id = :id with status NOT IN ('Rejected','Expired','Cancelled')
  Check: no rfq.contact_id = :id with rfq_status != 'Closed'
  If active references exist: 409 { error: 'Reassign contact from active quotations/RFQs first', count: N }

══════════════════════════════════════════
TASK 3 — NIGHTLY BATCH JOBS
══════════════════════════════════════════
Account Inactive batch:
  Find accounts with no activity in 365 days:
  SELECT account_id FROM account
  WHERE account_status NOT IN ('Inactive','Lost')
  AND account_id NOT IN (
    SELECT account_id FROM opportunity WHERE stage NOT IN ('Won','Lost')
    UNION SELECT account_id FROM rfq WHERE rfq_status != 'Closed'
    UNION SELECT account_id FROM quotation WHERE quotation_status NOT IN ('Accepted','Rejected','Expired')
    UNION SELECT account_id FROM customer_visit WHERE planned_date > DATE_SUB(NOW(), INTERVAL 365 DAY)
  )
  → UPDATE account_status='Inactive'; INSERT account_status_history for each

Account → Active automation:
  On Quotation Accept (called from quotation API):
  If account.account_status = 'Prospect' → UPDATE to 'Active'; INSERT account_status_history

Birthday reminder (nightly):
  Contact birthday = today → INSERT notification_log to assigned_sales_owner

══════════════════════════════════════════
TASK 4 — ACCOUNT 360° VIEW (Frontend)
══════════════════════════════════════════
Header: account_name, account_code badge, status pill, Key Account ⭐ badge (if is_key_account), territory

8 Tabs:
  1. Overview: 2-column grid all account fields; Key Account toggle (Manager/Admin only)
  2. Contacts: contact cards — name, designation, category badge (Technical=blue/Purchase=green/Finance=purple), primary badge, decision-maker crown; "Add Contact" button
  3. Opportunities: table — Stage (pill), Name, Value (₹), Probability%, Expected Close, Stage progress bar
  4. Quotations: table — Quote#, Status pill, Grand Total, Validity date, PDF download button
  5. RFQs: table — RFQ#, Priority badge (Urgent=red/Normal=gray), Status, Customer Due Date
  6. Visits: timeline cards — date, purpose badge, status, executive, summary preview
  7. Documents: upload dropzone + file list (type icon, name, date, download link)
  8. Activity Timeline: <TimelineComponent relatedType="Account" relatedId={id} />

Right sidebar (sticky on desktop):
  Credit Info card: credit_limit (₹), credit_terms (days) — editable for Finance role only
  Territory, Sales Owner, Account Type, Created Date

══════════════════════════════════════════
TASK 5 — CONTACT DETAIL VIEW (Frontend)
══════════════════════════════════════════
Header: avatar placeholder, full_name, designation, account link (→ account detail), category badge
Quick actions: 📞 Call, 📧 Email, 💬 WhatsApp (using phone/whatsapp_number)
Activity Timeline: <TimelineComponent relatedType="Contact" relatedId={id} />
Linked Account card: account_name, account_status, territory — clickable
Org chart section: if reports_to_contact_id set, show hierarchy (manager → this contact → direct reports)
Contact Preferences: preferred_channel, best_time_to_call, language_preference

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ Duplicate GSTIN blocked (409 error)
✓ Account without GSTIN allowed
✓ Contact requires valid account_id
✓ Finance role can edit credit_limit; Sales Executive gets 403
✓ account_credit_history created on credit change
✓ Account 360° view shows correct related counts
✓ Plant locations CRUD works; one marked as primary
✓ Cannot mark Inactive if open opportunity exists (blocked with message)
✓ One primary contact per account enforced automatically
✓ account_status_history recorded on every status change
```
