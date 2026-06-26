# Phase 5 — Sales Pipeline (Opportunities)
**Deadline:** June 25–26 | **Priority:** 🔴 Critical

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 5 — SALES PIPELINE (OPPORTUNITIES). Core revenue tracking module.

KEY RULES:
- Opportunity code: OPP-YYYY-NNNNN
- Stage backward requires Sales Manager or Admin role (403 otherwise)
- Cannot mark Won without at least one Quotation with status='Accepted'
- Lost requires lost_reason_id (mandatory)
- Overdue = expected_close_date < today AND stage NOT IN ('Won','Lost')
- Stage change always inserts opportunity_stage_history with days_in_previous_stage calculated

══════════════════════════════════════════
TASK 1 — OPPORTUNITIES API
══════════════════════════════════════════
POST /api/opportunities:
  Generate code = 'OPP-' + YEAR + '-' + LPAD(seq, 5, '0')
  Set probability_percent from pipeline_stage_master WHERE stage_name = initial stage
  INSERT opportunity_stage_history (initial)
  Auto-create stage-appropriate follow_up: 'Schedule discovery call'

POST /api/opportunities/:id/stage-change:
  Body: { to_stage, notes }
  Get display_order for current stage and to_stage from pipeline_stage_master
  If to_stage.display_order < current_stage.display_order (backward):
    Require role IN ('Sales Manager','Admin') → else 403 { error: 'Stage rollback requires Manager approval' }
  days_in_previous_stage = DATEDIFF(NOW(), last entry in opportunity_stage_history)
  UPDATE opportunity.stage; UPDATE probability_percent from pipeline_stage_master
  INSERT opportunity_stage_history (from_stage, to_stage, changed_by, days_in_previous_stage)
  Auto-create follow_up by stage:
    Meeting Scheduled → 'Confirm attendee list for meeting'
    Demo Conducted   → 'Get demo/trial feedback from customer'
  If estimated_value > 500000 AND same stage > 14 days (check stage history):
    INSERT notification_log to Sales Manager: 'High-value deal stale: [opp_name]'

POST /api/opportunities/:id/mark-won:
  Validate: SELECT 1 FROM quotation WHERE opportunity_id=:id AND quotation_status='Accepted'
  If none: 400 { error: 'Cannot mark Won — no Accepted Quotation linked to this opportunity' }
  UPDATE stage='Won'
  INSERT opportunity_stage_history

POST /api/opportunities/:id/mark-lost:
  Require lost_reason_id (400 if missing)
  UPDATE stage='Lost', lost_reason_id=:id
  INSERT opportunity_stage_history
  POST /api/follow-ups/bulk-cancel { related_to_type:'Opportunity', related_to_id::id }

GET/POST/DELETE /api/opportunities/:id/contacts:
  Stakeholder management via opportunity_contact junction table
  Valid roles: Decision Maker | Technical Evaluator | Influencer | Gatekeeper | Finance Approver
  POST: INSERT opportunity_contact (opportunity_id, contact_id, stakeholder_role, is_primary)

GET /api/opportunities/pipeline-summary:
  SELECT stage, COUNT(*) as count, SUM(estimated_value) as total_value,
         SUM(estimated_value * probability_percent/100) as weighted_value
  FROM opportunity WHERE stage NOT IN ('Won','Lost')
  GROUP BY stage ORDER BY display_order
  Used for funnel/bar chart on dashboard

GET /api/opportunities/forecast:
  Weighted pipeline per user/territory for dashboard

Nightly Batch:
  UPDATE opportunity SET is_overdue=TRUE
  WHERE expected_close_date < CURDATE() AND stage NOT IN ('Won','Lost')

══════════════════════════════════════════
TASK 2 — OPPORTUNITY DETAIL PAGE (Frontend)
══════════════════════════════════════════
Header section:
  Horizontal stage stepper (7 stages): current=highlighted fill, completed=filled check, future=outline circle
  Right side: Mark Won button (green, disabled if no accepted quotation) | Mark Lost button (red)
  Opportunity name, account link, code badge, probability%, estimated value

7 Tabs:
  1. Overview:
     Left col: opportunity_name, account, primary_contact, stage, estimated_value, expected_close_date,
               product_category, lead_source, competitor (dropdown)
     Right col: assigned_to, territory, probability (slider 0-100), description/notes

  2. Stakeholders:
     Contact cards: name, designation, role badge (color per role), primary ⭐ indicator
     "Add Stakeholder" button → search contacts + role dropdown modal
     Remove stakeholder (x) per card

  3. Line Items:
     Product search table: product (searchable), qty, estimated unit price, line total
     Add row / remove row
     Totals row at bottom

  4. RFQs: linked RFQ cards — RFQ#, status, priority badge, customer due date, link to RFQ detail

  5. Quotations: linked quotation cards — Quote#, status pill, grand total, validity, PDF download

  6. Stage History: timeline showing each stage transition
     Each entry: from → to arrow, who changed, date, days_in_previous_stage metric
     Stage duration bar (visual indicator of time spent in each stage)

  7. Activities: <TimelineComponent relatedType="Opportunity" relatedId={id} />

Mark Lost modal:
  loss_reason dropdown (from loss_reason_master) — required
  competitor dropdown (optional)
  notes textarea (optional)

══════════════════════════════════════════
TASK 3 — PIPELINE LIST VIEW (Frontend)
══════════════════════════════════════════
Tabs: All | Qualified | Req. Gathering | Technical | Meeting Scheduled | Demo Conducted | Overdue | Lost
Table columns: Code, Name, Account, Stage (pill), Value (₹), Probability%, Close Date (red if overdue),
               Assigned To, Competitor, Actions
Actions: View, Change Stage, Mark Won, Mark Lost, Reassign
Bulk bar: Stage Update | Reassign | Mark Lost | Export

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ Cannot mark Won without accepted quotation (clear error message)
✓ Stage backward blocked for Sales Executive (403 with message)
✓ Stage backward allowed for Sales Manager/Admin
✓ opportunity_stage_history inserted on every stage change with days_in_previous_stage
✓ probability_percent auto-updated from pipeline_stage_master on stage change
✓ Stakeholders stored in opportunity_contact junction (not text field)
✓ is_overdue flag updated nightly
✓ Bulk-cancel follow_ups fires on mark-lost
✓ Pipeline summary API returns weighted values correctly
✓ Stage history tab shows duration metrics per stage
```
