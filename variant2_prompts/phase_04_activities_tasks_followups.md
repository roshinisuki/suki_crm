# Phase 4 — Activities, Tasks & Follow Ups
**Deadline:** June 25 | **Priority:** 🟠 High

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 4 — ACTIVITIES, TASKS & FOLLOW UPS. Daily sales habit engine.

KEY RULES:
- Activity edit locked after 24h for non-Admin
- Meeting attendees → activity_attendee table (NEVER comma-separated text)
- Task complete: only assignee or Manager/Admin can mark
- Follow Up complete: outcome_notes required (min 5 chars)
- On Lead/Opportunity closed → bulk-cancel all open Follow Ups for that record

══════════════════════════════════════════
TASK 1 — ACTIVITIES API
══════════════════════════════════════════
POST /api/activities:
  Validate related_to_type IN ('Lead','Account','Contact','Opportunity','RFQ','Quotation')
  Validate related_to_id exists in the corresponding table
  INSERT activity record
  If activity_type='Meeting':
    INSERT activity_attendee rows for each { contact_id } in body.contact_ids[]
    INSERT activity_attendee rows for each { user_id } in body.user_ids[]
  INSERT audit_log

PUT /api/activities/:id:
  Check: (NOW() - created_at) < 24 hours OR user.role = 'Admin'
  If outside window: 409 { error: 'Edit window expired. Contact Admin.' }

GET /api/activities/timeline/:type/:id:
  SELECT * FROM activity WHERE related_to_type=:type AND related_to_id=:id
  If type='Lead': UNION lead_activity_log WHERE lead_id=:id
  ORDER BY timestamp DESC
  Return unified array: { id, source, type, icon, performed_by, timestamp, description, outcome }

══════════════════════════════════════════
TASK 2 — TASKS API
══════════════════════════════════════════
POST /api/tasks:
  Validate: due_date > NOW() (400 if past date)
  INSERT task
  INSERT notification_log to assigned_to (In-App): 'New task: [title]'
  Store reminder trigger: due_date - 1 day → INSERT notification for that time

PUT /api/tasks/:id/complete:
  Validate: current_user_id = task.assigned_to OR user.role IN ('Sales Manager','Admin')
  If invalid: 403 { error: 'Only the assignee or a Manager can complete this task' }
  UPDATE task SET task_status='Completed', completed_at=NOW()
  INSERT notification_log to assigned_by: 'Task completed: [title]'

PUT /api/tasks/:id/cancel:
  Require cancellation_reason non-empty string (400 if blank)
  UPDATE task SET task_status='Cancelled', cancellation_reason=:reason

POST /api/tasks/:id/comments:
  INSERT task_comment (task_id, user_id, comment_text, created_at)
  If commenter_id != task.assigned_to: notify assigned_to

Tasks Nightly Batch:
  UPDATE task SET task_status='Overdue'
  WHERE task_status='Pending' AND due_date < NOW()
  For each updated: INSERT notification_log to assigned_to (In-App)
  For Critical priority tasks overdue > 24h:
    also notify assigned_by + reporting_manager_id of assigned_to

══════════════════════════════════════════
TASK 3 — FOLLOW UPS API
══════════════════════════════════════════
POST /api/follow-ups:
  Validate: scheduled_datetime > NOW() (400 if past)
  INSERT follow_up
  Schedule 1-hour reminder: INSERT notification_log with send_at = scheduled_datetime - 1 hour

PUT /api/follow-ups/:id/complete:
  Require: outcome_notes.length >= 5 (400: 'Outcome notes must be at least 5 characters')
  UPDATE followup_status='Completed', completed_at=NOW()
  If body.schedule_next = true:
    INSERT new follow_up (type=body.next_type, scheduled=body.next_datetime, same assigned_to)
    UPDATE current follow_up SET next_followup_id = new_followup.id

PUT /api/follow-ups/:id/cancel:
  Require cancellation_reason non-empty
  UPDATE followup_status='Cancelled'

PUT /api/follow-ups/:id/reschedule:
  Validate new scheduled_datetime > NOW()
  UPDATE scheduled_datetime
  INSERT notification_log to assigned_to about rescheduled time

POST /api/follow-ups/bulk-cancel:
  Body: { related_to_type, related_to_id }
  UPDATE follow_up SET followup_status='Cancelled'
  WHERE related_to_type=:type AND related_to_id=:id
  AND followup_status IN ('Pending','Overdue')
  (Called when Lead marked Lost or Opportunity marked Won/Lost)

Follow Ups Nightly Batch:
  UPDATE follow_up SET followup_status='Overdue'
  WHERE followup_status='Pending' AND scheduled_datetime < NOW()
  For each: INSERT notification_log to assigned_to

══════════════════════════════════════════
TASK 4 — REUSABLE TIMELINE COMPONENT (Frontend)
══════════════════════════════════════════
Build: <TimelineComponent relatedType="..." relatedId={id} />

Fetches: GET /api/activities/timeline/:type/:id
Groups by date: Today | Yesterday | [date headers for older]
Each entry shows:
  - Icon by type: 📞 Call | 📧 Email | 💬 WhatsApp | 🤝 Meeting | 📝 Note
  - Type badge (colored)
  - Performed by name + relative time ("2 hours ago")
  - Description/outcome preview (first 100 chars)
  - Expand toggle to see full details

Quick-log bar at top:
  5 icon buttons → open Log Activity modal pre-filled with relatedType + relatedId

══════════════════════════════════════════
TASK 5 — LOG ACTIVITY MODAL (Dynamic form)
══════════════════════════════════════════
Type selector (Call/Email/WhatsApp/Meeting/Note) changes visible fields:

Call:    + direction (Inbound/Outbound), outcome (Connected/No Answer/Busy/Wrong Number), duration_minutes
Email:   + email_subject, body_preview
WhatsApp:+ template_selector (from communication_template WHERE channel='WhatsApp')
Meeting: + location, attendees multi-select (contacts from related account), meeting_status
Note:    description textarea only (no extra fields)

All types: subject/title, related_to pre-filled, performed_at datetime (default=NOW)

══════════════════════════════════════════
TASK 6 — COMPLETE FOLLOW UP MODAL (Frontend)
══════════════════════════════════════════
Fields:
  outcome_notes: textarea, required, min 5 chars, live character counter
  "Schedule Next Follow Up" toggle: default ON
  If toggle ON: followup_type dropdown + date-time picker (pre-filled +3 days from today)

Submit button: disabled until outcome_notes.length >= 5

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ Timeline shows all activity types in chronological order for any module
✓ Activity edit blocked after 24h for non-Admin (409 response)
✓ Meeting attendees stored in activity_attendee rows (not text)
✓ Task past due_date creation blocked (400)
✓ Task complete by wrong user returns 403
✓ Task cancellation requires non-blank reason
✓ Follow Up past datetime creation blocked (400)
✓ Follow Up completion requires outcome_notes >= 5 chars
✓ "Schedule Next" creates chained follow_up with next_followup_id link
✓ Bulk-cancel fires when Lead marked Lost (all open follow_ups cancelled)
✓ Nightly batch transitions Pending → Overdue for both tasks and follow-ups
```
