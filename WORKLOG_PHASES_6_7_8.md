# Work Log — Phases 6, 7, 8

## Phase 6 — Customer Visits
**Status:** ✅ Complete
**Deadline:** June 26

### Database / Schema
- `CustomerVisit` model — fields: customerId, plantLocationId, visitPurpose, plannedDate, plannedTime, checkInAt, checkInLat, checkInLng, checkOutAt, visitSummary, visitStatus (Planned/CheckedIn/Completed/Missed/Rescheduled), assignedUserId, linkedOpportunityId, companyId, soft-delete
- `CustomerVisitAttendee` junction table — visitId + contactId (no comma-separated text)
- `isKeyAccountV2` flag on Customer model for key account compliance tracking
- Back-relations on Customer, Contact, Deal (linkedOpportunity), User

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/visits` | GET | List visits with filters (status, date range, assigned_to) |
| `/api/visits` | POST | Create visit (validate account + plant_location, insert attendees, notify assigned user) |
| `/api/visits/[id]` | GET | Visit detail with attendees, account, linked opportunity |
| `/api/visits/[id]` | PUT | Update visit (Planned only) |
| `/api/visits/[id]` | DELETE | Soft-delete visit |
| `/api/visits/[id]/checkin` | POST | GPS check-in (lat/lng, anomaly warn if >1km from plant location) |
| `/api/visits/[id]/checkout` | POST | Check-out (requires check-in first) |
| `/api/visits/[id]/complete` | POST | Complete visit (requires visit_summary) |
| `/api/visits/[id]/reschedule` | POST | Reschedule planned visit (new date/time, status history) |
| `/api/visits/[id]/attendees` | GET/POST | Manage visit attendees |
| `/api/visits/key-account-compliance` | GET | Key accounts with last visit date, days since visit, compliance flag (>30 days) |
| `/api/accounts/[id]/visits` | GET | Visits for a specific account |
| `/api/key-accounts/visits` | GET | Visits for key accounts |
| `/api/cron/visits-missed` | GET | Nightly batch: mark Planned visits as Missed if planned datetime passed with no check-in |

### Frontend Pages
- `/(dashboard)/visits/page.tsx` — Visit list with status filters, calendar view toggle
- `/(dashboard)/visits/[id]/page.tsx` — Visit detail with check-in/check-out actions, GPS map, attendees list, linked opportunity, visit summary editor
- Key account compliance dashboard section

### Cron / Batch Jobs
- `visits-missed` nightly batch — marks visits as Missed

### Audit & Notifications
- Audit log on create, check-in, check-out, complete, reschedule
- Notification to assigned user on visit planned

---

## Phase 7 — RFQ Management
**Status:** ✅ Complete
**Deadline:** June 26–27

### Database / Schema
- `RFQ` model — rfqCode (RFQ-YYYY-NNNNN), customerId, opportunityId, priority (Urgent/Normal), status (New/CostingPending/CostingDone/Quoted/Closed/Cancelled), rfqReceivedDate, customerDueDate, costingOwnerId, assignedUserId, companyId, soft-delete
- `RFQLineItem` model — rfqId, productId, quantity, unit, hsnCode, specifications, targetPrice
- `RFQCostingSheet` model — rfqId, lineItemId, materialCost, laborCost, overheadCost, freightCost, otherCost, totalCost, computedUnitPrice (SERVER-COMPUTED), marginPercent, submittedById, submittedAt
- `RFQStatusHistory` model — rfqId, fromStatus, toStatus, changedById, changedAt, notes
- `RFQDocument` model — rfqId, fileName, fileUrl, fileType, uploadedById
- Back-relations on Customer, Deal (opportunity), Product, User

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rfq` | GET | List RFQs with filters (status, priority, assigned_to, date range) |
| `/api/rfq` | POST | Create RFQ (generate RFQ-YYYY-NNNNN code, auto-set Urgent if due ≤3 days, insert line items, initial status history) |
| `/api/rfq/[id]` | GET | RFQ detail with line items, costing sheets, status history, documents |
| `/api/rfq/[id]` | PUT | Update RFQ (New status only, validate line items before CostingPending) |
| `/api/rfq/[id]` | DELETE | Soft-delete RFQ |
| `/api/rfq/[id]/assign-costing` | POST | Assign costing owner (Costing Engineer), set status to CostingPending |
| `/api/rfq/[id]/costing-sheet` | GET/POST | Get/submit costing sheet (server computes computedUnitPrice from cost breakdown + margin) |
| `/api/rfq/[id]/documents` | GET/POST | Upload/list RFQ documents |
| `/api/rfq/[id]/generate-quotation` | POST | Atomic: create Quotation + QuotationItems from RFQ line items + costing sheets, set RFQ status to Quoted |
| `/api/rfq/stats` | GET | Summary stats (pending costing, overdue, conversion rate) |
| `/api/accounts/[id]/rfqs` | GET | RFQs for a specific account |

### Frontend Pages
- `/(dashboard)/rfq/page.tsx` — RFQ list with priority badges, status filters, costing owner column
- `/(dashboard)/rfq/[id]/page.tsx` — RFQ detail with line items table, costing sheet editor (role-restricted: Sales sees computed price only, Costing Engineer sees full breakdown), status timeline, document upload, generate quotation button

### Business Rules Enforced
- RFQ code format: `RFQ-YYYY-NNNNN`
- Auto-priority: Urgent if `customerDueDate - rfqReceivedDate ≤ 3 days`
- Cannot move to CostingPending without ≥1 line item
- `computedUnitPrice` is server-computed — client cannot override
- Role-restricted costing view: Sales Executive sees computed price only; Costing Engineer sees full cost breakdown
- Generate Quotation is atomic (single transaction)

### Audit & Notifications
- Audit log on create, assign-costing, costing-sheet submit, generate-quotation
- Notification to costing owner on assignment

---

## Phase 8 — Quotation Management
**Status:** ✅ Complete
**Deadline:** June 27

### Database / Schema
- `Quotation` model — quotationCode (QT-YYYY-NNNNN), rfqId, customerId, contactId, dealId, status (Draft/Sent/UnderReview/Accepted/Rejected/Expired), revisionNumber, subtotal, discountPercent, discountAmount, taxAmount, grandTotal (server-computed), validUntil, sentAt, acceptedAt, rejectedAt, rejectionReasonId, rejectionReason, paymentTerms, deliveryTerms, freightTerms, leadTimeDays, termsAndConditions, createdBy, companyId, soft-delete
- `QuotationItem` model — quotationId, productId, description, quantity, unitPrice, discountPercent, taxPercent, lineTotal (server-computed), hsn, unit, notes
- `QuotationStatusHistory` model — quotationId, fromStatus, toStatus, changedById, changedAt, notes
- `QuotationRevisionSnapshot` model — quotationId, revisionNumber, snapshotJson, createdById, createdAt
- `QuotationApproval` model — quotationId, requestedById, approverId, status (Pending/Approved/Rejected), discountPercent, notes, decidedAt, createdAt
- Back-relations on Customer, Contact, Deal, RFQ, Product, User

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/quotations` | GET | List quotations with filters (status, customer, date range) |
| `/api/quotations` | POST | Create quotation (generate QT-YYYY-NNNNN code, copy RFQ line items if rfqId provided, server-compute all totals, insert initial status history) |
| `/api/quotations/[id]` | GET | Quotation detail with items, customer, contact, RFQ, deal, status history, revision snapshots, approvals |
| `/api/quotations/[id]` | PUT | Update Draft quotation (server recompute totals, update line items, discount, validity, commercial terms) |
| `/api/quotations/[id]` | DELETE | Delete Draft quotation only (soft-delete) |
| `/api/quotations/[id]/send` | POST | Send quotation (check discount approval if >10%, create follow-up, notify creator, status history) |
| `/api/quotations/[id]/accept` | POST | Atomic cascade: quotation→Accepted, deal→Won, dealStageHistory, customer→Active, accountStatusHistory, RFQ→Closed, rfqStatusHistory, cancel follow-ups, notify managers |
| `/api/quotations/[id]/reject` | POST | Reject quotation (require rejectionReasonId, status history) |
| `/api/quotations/[id]/clone` | POST | Clone quotation (snapshot current revision, create new quotation with incremented revision number, copy line items, initial status history) |
| `/api/quotations/[id]/request-approval` | POST | Request discount approval (assign Sales Manager approver, prevent duplicate pending requests, notify approver) |
| `/api/quotations/[id]/approval` | PUT | Approve/reject discount approval (approver or Admin only, notify creator, audit log) |
| `/api/quotations/[id]/pdf` | GET | Generate printable HTML quotation document (company info, customer/contact, line items table, totals, commercial terms, print script) |
| `/api/quotations/stats` | GET | Summary stats (counts by status, expiring soon, expired pending, total accepted/sent values, conversion rate) |
| `/api/quotations/[id]/items` | PUT | (Legacy) Update line items only |
| `/api/quotations/[id]/create-deal` | POST | (Legacy) Create deal from accepted quotation |
| `/api/quotations/[id]/duplicate` | POST | (Legacy) Duplicate quotation |
| `/api/cron/quotations-expire` | GET | Nightly batch: mark Sent quotations as Expired if validUntil < today |

### Frontend Pages
- `/(dashboard)/quotations/page.tsx` — Quotation list with status pills, grand total, validity countdown, PDF download
- `/(dashboard)/quotations/[id]/page.tsx` — Full quotation detail with:
  - Tabbed interface: Line Items | Status History | Revisions | Approvals
  - Line items editor with product search, HSN, UOM, discount%, tax%, per-line totals
  - Server-computed totals display (subtotal, discount amount, tax amount, grand total)
  - Commercial terms section (payment, delivery, freight, lead time, T&C)
  - Approval banner for discount >10% with request-approval workflow
  - Pending approval banner with inline approve/reject for approvers
  - Validity countdown (days remaining, color-coded)
  - Revision number badge (R1, R2, etc.)
  - Clone & Revise action for all statuses
  - PDF opens in new tab (server-generated printable HTML)
  - Reject modal requires rejectionReasonId
  - Auto-refresh on action completion

### Business Rules Enforced
- Quotation code format: `QT-YYYY-NNNNN`
- All monetary totals server-computed (lineTotal, subtotal, discountAmount, taxAmount, grandTotal)
- Only Draft quotations can be edited or deleted
- Discount >10% requires manager approval before sending
- Accept cascade is atomic: deal→Won, customer→Active, RFQ→Closed, follow-ups→Cancelled
- Rejection requires rejectionReasonId
- Clone snapshots current revision and increments revision number
- Initial QuotationStatusHistory entry inserted on creation

### Audit & Notifications
- Audit log on create, update, send, accept, reject, clone, request-approval, approval decision
- Notifications to quotation creator on send, approval decision
- Notifications to Sales Managers on acceptance
- Notification to approver on approval request

### Cron / Batch Jobs
- `quotations-expire` nightly batch — marks Sent quotations as Expired

---

## Summary

| Phase | Endpoints | Frontend Pages | Schema Models | Cron Jobs | Status |
|-------|-----------|---------------|---------------|-----------|--------|
| 6 — Customer Visits | 14 | 2 | CustomerVisit, CustomerVisitAttendee | visits-missed | ✅ |
| 7 — RFQ Management | 11 | 2 | RFQ, RFQLineItem, RFQCostingSheet, RFQStatusHistory, RFQDocument | — | ✅ |
| 8 — Quotation Management | 17 | 2 | Quotation, QuotationItem, QuotationStatusHistory, QuotationRevisionSnapshot, QuotationApproval | quotations-expire | ✅ |
| **Total** | **42** | **6** | **12 models** | **2** | — |

### TypeScript Compilation
- All quotation-related `tsc` errors resolved
- Remaining `tsc` errors are pre-existing in unrelated files (customer-master, sales-pipeline, visitors, contacts, test files)
