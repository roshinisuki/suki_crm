# Phase 6 — Customer Visits
**Deadline:** June 26 | **Priority:** 🟠 High

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 6 — CUSTOMER VISITS. Field sales tracking with GPS check-in.

KEY RULES:
- Visit attendees stored in visit_attendee junction table (NEVER comma-separated text)
- GPS anomaly: if check-in location > 1km from account's plant location, warn (do not block)
- Key account visit compliance: flag if is_key_account=true and no visit in last 30 days
- Cannot complete visit without visit_summary
- Missed = Planned visit with no check-in after planned datetime passes (nightly batch)

══════════════════════════════════════════
TASK 1 — CUSTOMER VISITS API
══════════════════════════════════════════
POST /api/visits:
  Body: { account_id, plant_location_id, visit_purpose, planned_date, planned_time,
          assigned_to, attendee_contact_ids[], linked_opportunity_id (optional) }
  Validate: account exists, plant_location belongs to account, planned datetime > NOW()
  INSERT customer_visit (status='Planned')
  INSERT visit_attendee rows for each contact_id in attendee_contact_ids[]
  INSERT notification_log to assigned_to: 'Visit planned for [account_name] on [date]'

POST /api/visits/:id/checkin:
  Body: { gps_lat, gps_lng }
  Validate: visit.visit_status = 'Planned'
  Validate: visit.planned_date = today (cannot check in early by > 1 day)
  If plant_location has coordinates: calculate distance from check-in GPS
  If distance > 1km: return { warning: 'Check-in location is X km from registered plant address' }
  (warning is informational — do NOT block check-in)
  UPDATE customer_visit SET checkin_datetime=NOW(), gps_location='lat,lng', visit_status='Checked In'

POST /api/visits/:id/checkout:
  Validate: visit.visit_status = 'Checked In'
  UPDATE customer_visit SET checkout_datetime=NOW()

POST /api/visits/:id/complete:
  Body: { visit_summary, next_action, create_followup (bool), followup_type, followup_datetime }
  Require: visit_summary non-empty
  UPDATE customer_visit SET visit_status='Completed', visit_summary, next_action
  If create_followup=true: INSERT follow_up

POST /api/visits/:id/reschedule:
  Body: { new_planned_date, new_planned_time, reason }
  Validate: visit.visit_status = 'Planned'
  UPDATE planned_date, planned_time
  INSERT notification_log to assigned_to about new schedule

GET /api/visits/:id:
  Return visit + attendees (from visit_attendee JOIN contact) + linked opportunity

POST /api/visits/:id/attendees:
  INSERT visit_attendee (visit_id, contact_id)

GET /api/visits/key-account-compliance:
  SELECT a.account_id, a.account_name, a.assigned_sales_owner,
         MAX(v.planned_date) as last_visit_date,
         DATEDIFF(NOW(), MAX(v.planned_date)) as days_since_visit
  FROM account a
  LEFT JOIN customer_visit v ON a.account_id=v.account_id AND v.visit_status='Completed'
  WHERE a.is_key_account=true
  GROUP BY a.account_id
  ORDER BY days_since_visit DESC

Nightly Batch:
  Missed visits:
  UPDATE customer_visit SET visit_status='Missed'
  WHERE visit_status='Planned'
  AND CONCAT(planned_date,' ',planned_time) < NOW()
  AND checkin_datetime IS NULL
  For each missed: notify assigned_to + Sales Manager

  Key account compliance:
  For each key account with no completed visit in 30 days:
  INSERT notification_log to assigned_sales_owner: 'Key account [name] not visited in 30 days'

══════════════════════════════════════════
TASK 2 — FRONTEND SCREENS
══════════════════════════════════════════
Visits List:
  Tabs: Planned | Checked In | Completed | Missed | All Visits
  Table: Account, Plant Location, Purpose badge, Date+Time, Assigned To,
         Status pill, GPS icon (if checked in), Days Since (for compliance), Actions
  Actions: Check In (if Planned+today), Complete, Reschedule (if Missed/Planned), View
  Header button: "Key Account Compliance" → opens compliance view

Visit Detail:
  Header: Account name (link to account), plant location, purpose badge, status, assigned executive
  Status timeline bar: Planned → Checked In → Checked Out → Completed (grayed if not reached)
  Map section: if GPS captured, show coordinates (use Leaflet.js)
               Show warning banner if GPS anomaly was flagged
  Attendees section: contact name cards from visit_attendee; "Add Attendee" search button
  Visit Summary section: visit_summary text (editable until Completed), next_action field
  Related Opportunity: link card if linked_opportunity_id set
  Photo upload section: upload photos, grid thumbnail view

Plan Visit modal:
  Account search (autocomplete) → on select: load plant_location dropdown
  Purpose dropdown: Demo | Technical Discussion | Commercial Meeting | Relationship Visit | Complaint Resolution
  Date picker + Time picker
  Attendees multi-select (contacts from selected account)
  Assigned To dropdown
  Link Opportunity (optional search)

Complete Visit modal:
  visit_summary textarea: required, placeholder 'Enter visit outcome: discussions, decisions, next steps'
  next_action text input
  "Create Follow Up" toggle → if ON: followup_type dropdown + datetime picker

Check-In panel (mobile-optimized):
  Large "Check In Now" button (prominent, easy to tap on mobile)
  On click: navigator.geolocation.getCurrentPosition()
  Show: "Capturing your location..." spinner
  On success: show coordinates captured + Submit button
  Show warning if GPS anomaly detected (orange banner, not blocking)

Key Account Compliance view:
  Table: Account Name, Territory, Sales Owner, Last Visit Date, Days Since Visit
  Color coding: >90 days = red row | 60–90 = orange | 30–60 = yellow | <30 = green

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ Attendees stored in visit_attendee rows (not text)
✓ Check-in captures GPS coordinates
✓ GPS anomaly warning shown but check-in not blocked
✓ Cannot complete visit without visit_summary
✓ Nightly batch marks Planned visits Missed after planned time passes
✓ Key account compliance view shows correct last visit date
✓ Nightly notification fires for key accounts not visited in 30 days
✓ Attendees can be added from related account contacts
✓ Check-in only possible on planned_date (not days before)
```
