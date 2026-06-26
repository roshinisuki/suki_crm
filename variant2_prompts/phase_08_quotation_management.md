# Phase 8 — Quotation Management
**Deadline:** June 27–28 | **Priority:** 🔴 Critical

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 8 — QUOTATION MANAGEMENT. Commercially critical module with PDF, approvals, and cascading acceptance.

KEY RULES:
- Quotation code: QT-YYYY-NNNNN
- ALL monetary totals (grand_total, subtotal, tax_amount) are SERVER-COMPUTED — never trust client values
- Discount > threshold (default 10%) requires Sales Manager approval before sending
- Accept is ATOMIC: opportunity=Won + account=Active + RFQ=Closed + follow_ups=Cancelled in one transaction
- Clone always snapshots current revision before creating new one

══════════════════════════════════════════
TASK 1 — QUOTATION API
══════════════════════════════════════════
SERVER COMPUTATION FORMULA (apply on every create/update):
  line_total = quantity × unit_price × (1 - line_discount_percent/100)
  subtotal = SUM(line_total)
  discount_amount = subtotal × quotation.discount_percent/100
  tax_amount = SUM(line_total × tax_percent/100)
  grand_total = subtotal - discount_amount + tax_amount
  NEVER trust client-sent totals — always recompute server-side and store

POST /api/quotations:
  Generate code = 'QT-' + YEAR + '-' + LPAD(seq, 5, '0')
  Set revision_number = 1
  Validate: validity_date >= today
  If rfq_id in body: copy line_items from rfq_line_item + use rfq_costing_sheet.computed_unit_price as unit_price
  Server-compute all totals
  INSERT quotation (status='Draft')
  INSERT quotation_line_item[] rows
  INSERT quotation_status_history (initial='Draft')

PUT /api/quotations/:id (update line items, terms, discount):
  Validate: quotation.status = 'Draft'
  Recompute all totals server-side
  UPDATE quotation + quotation_line_items
  INSERT audit_log for changed fields

POST /api/quotations/:id/send:
  Validate: status='Draft', has at least 1 line item, validity_date >= today
  Check discount_percent against threshold (default 10% from settings):
    If discount > threshold AND no approved quotation_approval exists:
      Return 402 { requires_approval: true, message: 'Manager approval required before sending' }
  UPDATE quotation SET status='Sent', sent_at=NOW()
  INSERT quotation_status_history
  INSERT follow_up (type=Call, scheduled=NOW()+2days, purpose='Follow up on Quotation [code]')
  Queue email to contact with PDF (→ notification_outbox)
  INSERT notification_log to created_by: 'Quotation [code] sent successfully'

POST /api/quotations/:id/mark-accepted (DB TRANSACTION):
  1. UPDATE quotation SET status='Accepted', responded_at=NOW()
  2. INSERT quotation_status_history
  3. INSERT approval_audit_log (accepted event)
  4. If opportunity_id: UPDATE opportunity SET stage='Won'; INSERT opportunity_stage_history
  5. If account.account_status='Prospect': UPDATE account SET account_status='Active'; INSERT account_status_history
  6. If rfq_id: UPDATE rfq SET rfq_status='Closed'; INSERT rfq_status_history
  7. UPDATE follow_up SET followup_status='Cancelled'
     WHERE related_to_type='Opportunity' AND related_to_id=opportunity_id
     AND followup_status IN ('Pending','Overdue')
  8. INSERT notification_log to Sales Manager: 'Deal Won: [account_name] — [quotation_code] — ₹[grand_total]'
  9. INSERT notification_log to Finance/Order Processing: 'New order: Quotation [code]'
  10. INSERT notification_log (In-App congratulations) to created_by
  ROLLBACK ALL if any step fails

POST /api/quotations/:id/mark-rejected:
  Require rejection_reason_id (400 if missing)
  UPDATE quotation SET status='Rejected', rejection_reason_id, responded_at=NOW()
  INSERT quotation_status_history

POST /api/quotations/:id/clone:
  1. Fetch current quotation + line items
  2. INSERT quotation_revision_snapshot (quotation_id, revision_number=current, snapshot_json=JSON.stringify(quotation+lines), created_by)
  3. INSERT new quotation: same fields but status='Draft', revision_number=current+1,
     quotation_date=today, sent_at=NULL, responded_at=NULL, rejection_reason_id=NULL
  4. INSERT quotation_line_items (copy from current)
  5. Return new quotation_id

POST /api/quotations/:id/request-approval:
  INSERT quotation_approval (requested_by, approver_id=Sales Manager for territory, status='Pending')
  INSERT notification_log to approver: 'Approval needed: Quotation [code] has [discount]% discount'

PUT /api/quotations/:id/approval:
  Require: current_user_id = quotation_approval.approver_id OR role='Admin'
  Body: { decision: 'Approved'|'Rejected', notes }
  UPDATE quotation_approval.status, decided_at
  INSERT approval_audit_log
  If Approved: notify created_by: 'Quotation [code] approved — you may now send'
  If Rejected: notify created_by: 'Quotation approval rejected: [notes]'

GET /api/quotations/:id/pdf:
  Generate PDF using PDFKit/puppeteer:
    - Company header: name, logo, address, GSTIN (from settings)
    - Quotation number, date, validity date, Revision R[N] badge
    - Bill-to: account name, billing address, GSTIN
    - Line items table: Sl.No, Description, HSN, Qty, UOM, Unit Price, Disc%, Tax%, Line Total
    - Subtotal, Discount Amount, Tax Amount, Grand Total in INR
    - Payment Terms, Delivery Terms, Freight Terms, Lead Time
    - T&C section
    - Signature block: "For [Company Name]"
  Store at /uploads/quotations/[code]-R[revision].pdf
  Return file as download stream

Nightly Batch:
  Expire: UPDATE quotation SET status='Expired'
  WHERE status='Sent' AND validity_date < CURDATE()
  For each: INSERT quotation_status_history; notify created_by

  Expiring soon (7 days):
  SELECT * FROM quotation WHERE status='Sent' AND validity_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  For each: INSERT notification_log to created_by: 'Quotation [code] expires in X days'

══════════════════════════════════════════
TASK 2 — FRONTEND SCREENS
══════════════════════════════════════════
Quotation Detail:
  Header: Quotation number, Revision badge (R1/R2...), status pill,
          Validity countdown: "Expires in X days" (red if ≤ 3 days)

  Approval banner:
    If Draft + discount > threshold + no approved approval:
      Yellow banner: 'Manager approval required before sending' + "Request Approval" button
    If pending approval:
      Blue banner: 'Awaiting approval from [manager_name]'
      If current user = approver: show "Approve" (green) + "Reject" (red) buttons

  Line Items grid (editable in Draft status):
    Columns: #, Description, Product (searchable), HSN, Qty, UOM, Unit Price (₹), Disc%, Tax%, Line Total
    Add row button → product search → auto-fills Unit Price from product.base_price, HSN from product
    Remove row (x) per line
    Totals section below grid:
      Subtotal: ₹XX,XXX
      Discount (X%): -₹X,XXX
      Tax (GST): +₹X,XXX
      Grand Total: ₹XX,XXX (bold, larger font)
    Totals re-fetched from server on blur of any input (not calculated in browser)

  Commercial Terms (editable in Draft):
    payment_terms, delivery_terms, freight_terms, lead_time_days textareas

  Action buttons by status:
    Draft:            Edit Line Items | Request Approval | Send (if approved/below threshold) | Delete
    Approval Pending: [Manager only: Approve | Reject]
    Sent:             Mark Accepted | Mark Rejected | Clone & Revise | Download PDF
    Accepted/Expired: Clone & Revise | Download PDF | View Read-Only
    Rejected:         Clone & Revise | Download PDF

  Revision History tab:
    List of quotation_revision_snapshot entries
    Each: Revision #, Created by, Date, "View Snapshot" button

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ grand_total always server-computed (PUT with fake total recomputes and overrides)
✓ Discount > 10% blocked until manager approves
✓ Mark Accepted cascades: opportunity=Won, account=Active, RFQ=Closed, follow_ups=Cancelled
✓ Nightly expiry batch sets Expired, notifies creator
✓ Clone: revision_number+1, snapshot of previous revision stored
✓ PDF generates with all line items, terms, and correct totals
✓ Approval audit trail in approval_audit_log
✓ Cannot send without line items and valid validity_date
✓ Expiring-soon notification fires 7 days before validity_date
```
