# Phase 7 — RFQ Management
**Deadline:** June 26–27 | **Priority:** 🔴 Critical

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 7 — RFQ MANAGEMENT. Manufacturing-specific quoting pipeline.

KEY RULES:
- RFQ code: RFQ-YYYY-NNNNN
- Priority auto-set Urgent if customer_due_date - rfq_received_date <= 3 days
- Cannot move to Costing Pending without at least 1 line item
- computed_unit_price is SERVER-COMPUTED — client cannot override it
- Role-restricted costing view: Sales sees computed price only; Costing Engineer sees full breakdown
- Generate Quotation is ATOMIC: creates quotation + line items in one DB transaction

══════════════════════════════════════════
TASK 1 — RFQ API
══════════════════════════════════════════
POST /api/rfqs:
  Generate code = 'RFQ-' + YEAR + '-' + LPAD(seq, 5, '0')
  Validate: rfq_received_date <= customer_due_date
  Auto-set priority: DATEDIFF(customer_due_date, rfq_received_date) <= 3 → priority='Urgent'
  INSERT rfq (status='New')
  INSERT rfq_line_item[] rows from body.line_items[]
  INSERT rfq_status_history (initial status='New')
  If priority='Urgent': INSERT notification_log to assigned_to.manager + costing team: 'URGENT RFQ received'
  If opportunity_id provided: UPDATE opportunity stage to 'Requirement Gathering' if not already further

POST /api/rfqs/:id/assign-costing:
  Body: { assigned_costing_owner }
  Validate: rfq has at least 1 line item (400 if none)
  Validate: assigned user exists and is_active=true
  UPDATE rfq.assigned_costing_owner, rfq.rfq_status='Costing Pending'
  INSERT rfq_status_history
  INSERT notification_log to assigned_costing_owner (In-App + Email):
    'RFQ [code] assigned for costing. Customer due: [customer_due_date]'

POST /api/rfqs/:id/costing-sheet:
  Require permissionMiddleware('RFQ','SubmitCosting') — Costing Engineer/Admin only
  Body: { material_cost, labour_cost, overhead_percent, margin_percent }
  Validate: all 4 values > 0
  SERVER-COMPUTE: computed_unit_price = (material_cost + labour_cost) * (1 + overhead_percent/100) * (1 + margin_percent/100)
  Validate computed_unit_price > 0
  INSERT rfq_costing_sheet (do NOT UPDATE — preserve costing history)
  INSERT notification_log to rfq.assigned_to (Sales Executive): 'Costing ready for RFQ [code]'

GET /api/rfqs/:id/costing-sheet:
  If user.role = 'Costing Engineer' OR 'Admin' OR 'Sales Manager':
    Return full breakdown: material_cost, labour_cost, overhead_percent, margin_percent, computed_unit_price
  If user.role = 'Sales Executive' OR 'Telecaller':
    Return only: { computed_unit_price }
  (Role-restricted view — do NOT expose cost breakdown to Sales)

POST /api/rfqs/:id/generate-quotation (DB TRANSACTION):
  Validate: rfq_costing_sheet exists for this rfq_id
  1. CREATE quotation:
     account_id, contact_id from rfq
     rfq_id = :rfq_id
     quotation_date = today, validity_date = today+30
     status = 'Draft'
     Generate quotation_number = 'QT-YYYY-NNNNN'
  2. CREATE quotation_line_item for each rfq_line_item:
     product_id, description=item_description, quantity
     unit_price = rfq_costing_sheet.computed_unit_price
     Lookup tax_percent from tax_master by product HSN code (default 18% if not found)
     line_total = quantity * unit_price * (1 - discount_percent/100)
  3. Compute subtotal, tax_amount, grand_total (all server-side)
  4. UPDATE rfq.rfq_status = 'Quotation Created'; INSERT rfq_status_history
  5. Return { quotation_id } for frontend redirect
  ROLLBACK ALL if any step fails

GET /api/rfqs/stats:
  Return: {
    pending_costing: count WHERE status='Costing Pending',
    aging_0_2: count WHERE status='Costing Pending' AND days_since_creation BETWEEN 0 AND 2,
    aging_3_5: count WHERE days_since_creation BETWEEN 3 AND 5,
    aging_5_plus: count WHERE days_since_creation > 5,
    overdue_customer_due: count WHERE customer_due_date < CURDATE() AND status NOT IN ('Quotation Created','Closed'),
    rfq_to_quotation_rate: (count status='Quotation Created' / total count) * 100
  }

POST /api/rfqs/:id/documents (multipart upload):
  Save file, INSERT document (related_to_type='RFQ', related_to_id=:id, document_type='Drawing', ...)
  Do NOT use raw file path varchar on rfq table

Nightly Batch:
  RFQs in Costing Pending > 30 days after Quotation Created with no response:
  INSERT notification_log to Sales Manager: 'RFQ [code] pending close — customer not responded in 30+ days'

══════════════════════════════════════════
TASK 2 — FRONTEND SCREENS
══════════════════════════════════════════
RFQ List:
  Tabs: New | Under Review | Costing Pending | Quotation Created | Closed
  Table: RFQ Code, Account, Priority (Urgent=red badge/Normal=gray), Customer Due Date
         (red if past), Status, Assigned To, Costing Owner, Days Pending, Actions
  Aging color on Costing Pending tab: 0-2 days=normal | 3-5=orange row | 5+=red row
  Actions: Change Status, Assign Costing Owner, Generate Quotation, View Drawing, Export

RFQ Detail:
  Status progress tracker: New → Under Review → Costing Pending → Quotation Created → Closed
  Priority badge + Urgency countdown: "X days until customer due date" (red if ≤ 2 days)

  Line Items table:
    Columns: Description, Product (if linked), Qty, Unit, Target Price, Delivery Date
    Edit/delete per row; Add row button
    "Assign for Costing" button (enabled when at least 1 line item exists)

  Drawings/Attachments section:
    Upload area (drag-drop) + file list with type icon, filename, upload date, download link

  Costing Sheet section (visible after Costing Pending status):
    If Costing Engineer role:
      Editable form: material_cost (₹), labour_cost (₹), overhead% , margin%
      Real-time formula result: computed_unit_price shown below as user types
      Formula display: (material + labour) × (1 + overhead%) × (1 + margin%)
      Submit Costing button
    If Sales Executive role:
      Read-only display: Computed Unit Price: ₹X,XXX only (no breakdown shown)

  Generate Quotation button:
    Enabled only when costing sheet submitted
    On click: confirmation modal → call API → redirect to /quotations/[new_id]

Real-time costing calculator (frontend):
  onChange on any input → compute: (material + labour) * (1 + overhead/100) * (1 + margin/100)
  Display formatted result instantly below form (before submission)

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ Priority auto-set Urgent on 3-day rule at creation
✓ Cannot move to Costing Pending without line items (400 error)
✓ computed_unit_price = formula result (server-computed, not client-editable)
✓ Sales Executive sees only computed_unit_price, not breakdown
✓ Generate Quotation: quotation + line items created atomically, RFQ status = Quotation Created
✓ Drawing upload stored in document table (not rfq.drawing_path varchar)
✓ Status history recorded on every status change
✓ Urgent RFQ notifies manager + costing team immediately
✓ Aging color coding on Costing Pending tab
✓ Stats endpoint returns correct counts and aging buckets
```
