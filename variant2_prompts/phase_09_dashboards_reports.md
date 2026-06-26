# Phase 9 — Dashboards & Reports
**Deadline:** June 28–29 | **Priority:** 🟠 High

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 9 — DASHBOARDS & REPORTS. Live KPIs, 2 dashboards, 6 reports.

KEY RULES:
- Row-level security on ALL queries: Sales Executive → own data; Manager → territory; Admin → all
- KPI data is live (no hardcoded values)
- Dashboard auto-refreshes every 15 minutes via setInterval
- Excel export must include headers, data rows, summary row

══════════════════════════════════════════
TASK 1 — DASHBOARD APIs
══════════════════════════════════════════
GET /api/dashboard/my (Sales Executive — own data only):
Return single response object:
{
  leads: { new_today, total_open, overdue, sql },
  followups: { due_today, overdue, pending },
  tasks: { pending, overdue, due_today },
  pipeline: {
    total_value: SUM(estimated_value) WHERE stage NOT IN (Won,Lost),
    weighted_value: SUM(estimated_value * probability_percent/100),
    by_stage: [{ stage, count, total_value, weighted_value }]
  },
  quotations: { sent_this_month, accepted_this_month, expiring_7_days, total_value_sent, total_value_accepted },
  rfqs: { pending_costing, overdue_due_date },
  visits: { planned_today, completed_this_week, missed_this_month },
  target: { monthly_target, achieved, achievement_pct, days_remaining_in_month }
}
All filtered: assigned_to = current_user_id (for Sales Executive role)

GET /api/dashboard/manager (Sales Manager/Admin only):
Same structure PLUS:
  team_performance: [{
    user_id, full_name, leads_count, pipeline_value,
    quotations_sent, visits_completed, achievement_pct
  }]
  win_rate: (won_opportunities / total_closed) * 100
  avg_sales_cycle_days: AVG(DATEDIFF(won_date, created_at)) WHERE stage=Won AND this_month

Row-level security helper (apply to ALL queries):
  Sales Executive: filter by assigned_to = user_id
  Sales Manager:   filter by assigned_to IN (users WHERE territory_id = manager's territory_id)
  Admin/Director:  no filter (all data)

══════════════════════════════════════════
TASK 2 — REPORTS API (6 standard reports)
══════════════════════════════════════════
Common params for all: date_from, date_to, territory_id, assigned_to, status, export (bool)
Apply row-level security scope to every report query.

GET /api/reports/leads:
  Columns: lead_code, company_name, source_name, lead_status, lead_score,
           assigned_to_name, created_at, days_in_current_status
  Aggregates in header: total_leads, by_source (counts), by_status (counts),
                        conversion_rate (SQL / total * 100)

GET /api/reports/opportunities:
  Columns: opportunity_code, opportunity_name, account_name, stage, estimated_value,
           probability_percent, expected_close_date, assigned_to_name, days_open, is_overdue
  Aggregates: total_pipeline, weighted_pipeline, win_rate, avg_deal_size, avg_sales_cycle_days

GET /api/reports/quotations:
  Columns: quotation_code, account_name, status, grand_total, discount_percent,
           validity_date, sent_at, responded_at, days_to_respond
  Aggregates: total_sent_value, total_accepted_value, conversion_rate, avg_discount_percent

GET /api/reports/rfqs:
  Columns: rfq_code, account_name, priority, rfq_status, rfq_received_date,
           customer_due_date, days_to_quote, linked_quotation_code
  Aggregates: avg_turnaround_days, conversion_rate (RFQ→Quotation), overdue_count

GET /api/reports/follow-ups:
  Columns: followup_type, related_to (entity name), scheduled_datetime,
           assigned_to_name, status, outcome_notes, days_overdue
  Aggregates: completion_rate, avg_overdue_days

GET /api/reports/visits:
  Columns: account_name, plant_location, visit_purpose, planned_date,
           visit_status, visit_summary_preview, assigned_to_name
  Aggregates: planned_count, completed_count, missed_count, completion_rate,
              key_account_compliance_rate

POST /api/reports/:reportId/export:
  Body: { format: 'excel'|'pdf', filters: {...} }
  Run same query as GET with filters
  Excel (use exceljs):
    Row 1: header row (bold)
    Rows 2-N: data rows
    Row N+1: summary row (totals/averages)
    Sheet name = report name
    Return as .xlsx download stream
  PDF: formatted table via PDFKit or puppeteer
  INSERT report_export_log (report_id, exported_by, filters_applied=JSON, exported_at=NOW())

══════════════════════════════════════════
TASK 3 — MY DASHBOARD (Frontend)
══════════════════════════════════════════
Layout: 2-column grid on desktop, single column on mobile

Row 1 — KPI Cards (4 cards):
  New Leads Today | Today's Follow Ups (due) | Pipeline Value (weighted ₹) | Monthly Achievement %
  Each card: metric value (large), label, trend arrow vs last week

Row 2 — Pipeline Funnel:
  recharts BarChart (horizontal): stages on Y-axis, count + value on X-axis
  Color coded by stage: green → yellow → orange → red (Qualified → Overdue)

Row 3 — Quotations Chart:
  recharts ComposedChart: bars for sent vs accepted by month (last 3 months)

Row 4 — Today's Action Items (2 mini-lists side by side):
  Left: "Follow Ups Due Today" — max 5, each with related entity name, time, type icon, "Complete" button
  Right: "Overdue Tasks" — max 5, title, due date, priority badge, "Complete" button
  Both have "View All" link

Auto-refresh: useEffect with setInterval(15 * 60 * 1000) → refetch /api/dashboard/my

══════════════════════════════════════════
TASK 4 — SALES MANAGER DASHBOARD (Frontend)
══════════════════════════════════════════
All of My Dashboard PLUS:

Team Performance table:
  Columns: Executive Name, Leads (Open), SQL Count, Pipeline Value (₹), Quotations Sent,
           Visits Completed, Monthly Achievement %
  Sortable columns; highlight top performer (gold) + bottom performer (red)

Target vs Achievement gauge:
  recharts RadialBarChart showing % to monthly target
  Color: <50%=red, 50-80%=amber, 80-100%=green, >100%=gold
  Text in center: "X% of Target"

Win Rate card: large percentage, vs last month comparison

══════════════════════════════════════════
TASK 5 — REPORTS LIST PAGE + REPORT VIEW (Frontend)
══════════════════════════════════════════
Reports List page:
  3×2 grid of report cards
  Each card: report name, brief description, last-run date, "Run Report" button, "Schedule" button

Shared Report View page (parameterized by reportId):
  Left panel (collapsible on mobile): filter form (date range, territory, assigned_to, status, etc.)
  Top row: 2-3 aggregate metric cards (e.g., "Total Pipeline: ₹XX" | "Win Rate: XX%" | "Avg Deal: ₹XX")
  Main: sortable data table with all columns; pagination
  Export buttons: "Export Excel" | "Export PDF"
  "Schedule This Report" button → modal with:
    frequency dropdown (Daily/Weekly/Monthly)
    delivery format (PDF/Excel/Email Body)
    recipients multi-select (users)
    Save → INSERT/UPDATE report_schedule

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ My Dashboard KPIs match manually counted records from module pages
✓ Manager Dashboard shows team totals (not just logged-in user)
✓ Sales Executive runs Opportunity Report → sees only own opportunities
✓ Manager runs same report → sees team's opportunities
✓ Lead Report with Source=Website filter → only website leads returned
✓ Excel export downloads .xlsx with correct headers and data
✓ All 6 reports load without errors
✓ Dashboard auto-refreshes every 15 minutes
✓ Target vs Achievement % calculated from sales_target + won opportunities
✓ No hardcoded KPI values anywhere
```
