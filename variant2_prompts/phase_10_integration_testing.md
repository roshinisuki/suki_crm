# Phase 10 — Final Integration Testing & Hardening
**Deadline:** June 30 – July 1 | **Priority:** 🟢 Final Gate

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are running PHASE 10 — FINAL INTEGRATION TESTING & HARDENING.
All modules are built. Verify, fix, and certify the complete system.

══════════════════════════════════════════
TASK 1 — FULL END-TO-END TEST SCENARIO
══════════════════════════════════════════
Run this complete flow and verify DB state after each step:

Step 1: POST /api/leads
  { company_name:"Acme Auto Components", phone:"9876543210", lead_source_id:1, territory_id:1 }
  Assert: lead_code = 'LD-YYYY-NNNNN', assigned_to populated, follow_up created, lead_score calculated,
          notification_log entry 'New Lead Assigned', lead_status_history (NULL → New)

Step 2: POST /api/leads/:id/log-activity
  { activity_type:'Call', outcome:'Connected', notes:'Discussed bearing requirement' }
  Assert: lead.lead_status = 'Contacted', lead_status_history (New → Contacted)

Step 3: POST /api/leads/:id/qualify
  { has_budget:true, has_authority:true, has_need:true, timeline_months:3 }
  Assert: lead_qualification_checklist created, lead.lead_status = 'SQL',
          notification_log to Sales Manager 'Lead SQL'

Step 4: POST /api/leads/:id/convert
  { account:{account_name:'Acme Auto', gst_number:'29AABCU9603R1ZN', account_type:'OEM'},
    contact:{full_name:'Rajesh Kumar', designation:'Purchase Manager', contact_category:'Purchase'},
    opportunity:{opportunity_name:'Bearing Supply - Acme', estimated_value:500000, expected_close_date:'2026-09-01'} }
  Assert: account created (ACC-XXXXX), contact created, opportunity created (OPP-YYYY-NNNNN),
          lead.converted_account_id + converted_opportunity_id populated,
          opportunity.stage='Qualified', probability_percent=20,
          opportunity_stage_history initial record inserted

Step 5: POST /api/opportunities/:id/stage-change { to_stage:'Requirement Gathering' }
  Assert: opportunity.stage='Requirement Gathering', probability_percent=35,
          opportunity_stage_history inserted with days_in_previous_stage,
          follow_up auto-created for new stage

Step 6: POST /api/opportunities/:id/contacts
  { contact_id: [search for Rajesh Kumar], stakeholder_role:'Decision Maker', is_primary:true }
  Assert: opportunity_contact row inserted (not text field)

Step 7: POST /api/visits
  { account_id, plant_location_id, visit_purpose:'Technical Discussion', planned_date:today, assigned_to }
  Assert: customer_visit created (status=Planned), visit_attendee rows created (not text)

Step 8: POST /api/visits/:id/checkin { gps_lat:X, gps_lng:Y }
  Assert: visit.visit_status='Checked In', checkin_datetime populated, gps_location stored

Step 9: POST /api/visits/:id/complete { visit_summary:'Discussed bearing specs, customer confirmed qty 500', next_action:'Send RFQ' }
  Assert: visit.visit_status='Completed', visit_summary stored

Step 10: POST /api/rfqs
  { account_id, contact_id, rfq_received_date:today, customer_due_date:today+7, opportunity_id,
    line_items:[{item_description:'Industrial Bearings 6205', quantity:500, target_price:120}] }
  Assert: rfq created (RFQ-YYYY-NNNNN), rfq_line_item created, rfq_status_history (New),
          priority = 'Normal' (7 days), opportunity stage updated if needed

Step 11: POST /api/rfqs/:id/assign-costing { assigned_costing_owner: [costing user id] }
  Assert: rfq.rfq_status='Costing Pending', assigned_costing_owner set,
          notification_log to costing owner

Step 12: POST /api/rfqs/:id/costing-sheet
  { material_cost:50, labour_cost:20, overhead_percent:15, margin_percent:20 }
  Assert: computed_unit_price = (50+20)*(1.15)*(1.20) = 96.6
          rfq_costing_sheet inserted (NOT updated), notification to Sales Executive

Step 13: POST /api/rfqs/:id/generate-quotation
  Assert: quotation created (QT-YYYY-NNNNN, revision_number=1, status='Draft'),
          quotation_line_items created (unit_price=96.6, qty=500),
          grand_total server-computed correctly,
          rfq.rfq_status='Quotation Created', rfq_status_history inserted

Step 14: POST /api/quotations/:id/send
  Assert: If discount_percent=0 → status='Sent', follow_up created (T+2 days),
          sent_at populated, notification_outbox entry for email

Step 15: POST /api/quotations/:id/mark-accepted
  Assert ALL of these simultaneously:
  - quotation.status = 'Accepted', responded_at populated
  - opportunity.stage = 'Won', opportunity_stage_history inserted
  - account.account_status = 'Active' (was Prospect), account_status_history inserted
  - rfq.rfq_status = 'Closed', rfq_status_history inserted
  - All open follow_ups for opportunity: status='Cancelled'
  - notification_log: 'Deal Won' to Sales Manager
  - notification_log: 'New Order' to Finance
  - notification_log: congratulations to quotation.created_by

══════════════════════════════════════════
TASK 2 — PERMISSION BOUNDARY TEST MATRIX
══════════════════════════════════════════
Test each endpoint with each role — verify HTTP status code:

| Endpoint                              | Sales Exec | Telecaller | Manager | Finance | Admin |
|---------------------------------------|-----------|-----------|---------|---------|-------|
| GET /api/settings/roles               | 403       | 403       | 403     | 403     | 200   |
| PUT /api/accounts/:id (credit_limit)  | 403       | 403       | 403     | 200     | 200   |
| PUT /api/quotations/:id/approval      | 403       | 403       | 200     | 403     | 200   |
| DELETE /api/leads/:id                 | 403       | 403       | 403     | 403     | 200   |
| GET /api/dashboard/manager            | 403       | 403       | 200     | 403     | 200   |
| POST /api/rfqs/:id/costing-sheet      | 403       | 403       | 403     | 403     | 200   |
| POST /api/opportunities/:id/mark-won  | 200       | 403       | 200     | 403     | 200   |

Fix any permission gaps found before signing off.

══════════════════════════════════════════
TASK 3 — DATA INTEGRITY SQL CHECKS
══════════════════════════════════════════
Run these queries — all should return 0 rows (or investigate if not):

1. Orphaned follow-ups:
   SELECT * FROM follow_up WHERE related_to_type='Lead'
   AND related_to_id NOT IN (SELECT lead_id FROM lead)
   → should return 0

2. Won opportunities without accepted quotation:
   SELECT * FROM opportunity WHERE stage='Won'
   AND opportunity_id NOT IN (
     SELECT opportunity_id FROM quotation WHERE quotation_status='Accepted'
   )
   → should return 0

3. Active accounts with no qualifying transaction:
   SELECT * FROM account WHERE account_status='Active'
   AND account_id NOT IN (
     SELECT account_id FROM quotation WHERE quotation_status='Accepted'
     UNION SELECT account_id FROM opportunity WHERE stage='Won'
   )
   → investigate and explain any results

4. Meetings with attendees as text (should be 0 — all in junction table):
   SELECT activity_id FROM activity
   WHERE activity_type='Meeting' AND meeting_attendees IS NOT NULL AND meeting_attendees != ''
   → should return 0

5. Visits with attendees as text:
   SELECT visit_id FROM customer_visit
   WHERE contact_ids IS NOT NULL AND contact_ids != ''
   → should return 0

══════════════════════════════════════════
TASK 4 — NOTIFICATION COVERAGE AUDIT
══════════════════════════════════════════
Verify notification_log has entries for ALL these triggers (run after E2E test):

Leads:        New Lead Assigned | Lead Not Contacted (24h) | Lead Overdue | Lead SQL | Duplicate Detected
Opportunities: New Opportunity | Stage Change | Stale High-Value Deal
Tasks:         Task Assigned | Task Overdue | Critical Task Escalation
Follow Ups:    1-Hour Reminder | Follow Up Overdue
Visits:        Visit Planned | Visit Missed | Key Account 30-Day Alert
RFQ:           Urgent RFQ | Costing Assigned | Costing Ready
Quotation:     Approval Needed | Approved | Rejected | Sent | Expiring 7 Days | Accepted (Deal Won) | Order Processing | Expired
Auth:          Login Failure (5x lockout) | User Deactivated | Account Locked

For any missing triggers: find the automation rule and add the notification_log INSERT.

══════════════════════════════════════════
TASK 5 — PERFORMANCE INDEXES
══════════════════════════════════════════
Add these indexes if not already present:

CREATE INDEX idx_lead_assigned_status    ON lead(assigned_to, lead_status, created_at DESC);
CREATE INDEX idx_opp_stage_assigned      ON opportunity(stage, assigned_to, is_overdue, expected_close_date);
CREATE INDEX idx_quotation_status_val    ON quotation(quotation_status, validity_date);
CREATE INDEX idx_rfq_status_due          ON rfq(rfq_status, customer_due_date, assigned_to);
CREATE INDEX idx_followup_assigned_date  ON follow_up(assigned_to, followup_status, scheduled_datetime);
CREATE INDEX idx_notification_recipient  ON notification_log(recipient_user_id, is_read, created_at DESC);
CREATE INDEX idx_activity_polymorphic    ON activity(related_to_type, related_to_id, performed_at DESC);
CREATE INDEX idx_audit_record            ON audit_log(table_name, record_id, changed_at DESC);

══════════════════════════════════════════
TASK 6 — MOBILE RESPONSIVENESS CHECK
══════════════════════════════════════════
Test at 375px viewport (iPhone SE). Fix any overflow/layout issues on:

✓ Visit Check-In screen — large tap target "Check In Now" button
✓ Complete Follow Up modal — all inputs visible without horizontal scroll
✓ Lead list — horizontal scroll OR stacked card layout (not cut-off table)
✓ My Dashboard — cards stack vertically, charts resize responsively
✓ Log Activity modal — form fields full-width on mobile

══════════════════════════════════════════
TASK 7 — FINAL LAUNCH CHECKLIST
══════════════════════════════════════════
Before handing over to UAT, verify each item:

☐ All 10 module sections accessible from navigation without errors
☐ Variant 1 navigation smoke test — no 404s or console errors
☐ Variant 2 complete E2E flow (Phase 10 Task 1) passes
☐ PDF quotation generates and downloads with correct data
☐ Excel export works for all 6 reports
☐ All 5 nightly batch jobs testable manually (endpoint or script)
☐ All 5 roles tested for permission boundaries
☐ No console errors on initial page load for any module
☐ API error responses return user-friendly messages (not stack traces)
☐ All file uploads (account documents, RFQ drawings, visit photos) return accessible URLs
☐ Audit log has entries for: discount approval, credit limit change, user deactivation
☐ Row-level security verified for reports (Sales Executive sees own data only)
☐ Dashboard KPIs verified against raw database counts
☐ All status history tables populated correctly through E2E scenario

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ Complete E2E scenario (Lead → Quotation Accepted) runs without errors
✓ All 10 module screens load in under 3 seconds
✓ No broken links or empty/blank screens in navigation
✓ Role-based access: all 5 roles tested, no unauthorized data exposure
✓ PDF quotation correct with all fields and computed totals
✓ All 6 reports export to valid Excel files
✓ Mobile: visit check-in and follow-up completion work on 375px viewport
✓ Zero data integrity violations (SQL checks return 0 rows)
✓ All 30+ notification triggers verified in notification_log
```
