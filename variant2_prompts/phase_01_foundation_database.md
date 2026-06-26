# Phase 1 — Foundation & Database
**Deadline:** June 23 | **Priority:** 🔴 Critical

> Paste 00_system_context.md content first, then this prompt.

---

## Prompt

```
You are implementing PHASE 1 — FOUNDATION & DATABASE.
Nothing else exists yet. Build the complete database, auth system, and Settings module.

══════════════════════════════════════════
TASK 1 — DATABASE MIGRATIONS (run in order)
══════════════════════════════════════════
BATCH 1 (no FKs yet):
  users, roles

BATCH 2 (master/lookup tables):
  territory, lead_source_master, pipeline_stage_master, loss_reason_master, tax_master, product_category

BATCH 3 (core feature tables):
  lead, account, contact, opportunity, rfq, quotation, activity, task, follow_up, customer_visit,
  product, product_specification, product_document, lead_activity_log, lead_qualification_checklist,
  opportunity_line_item, opportunity_stage_history, rfq_line_item, rfq_costing_sheet,
  quotation_line_item, quotation_approval, report_definition, report_schedule, report_export_log,
  dashboard_widget_config, dashboard_user_preference, sales_target

BATCH 4 (gap-fill masters):
  communication_template, document, custom_field_definition, custom_field_value, user_session

BATCH 5 (junction/many-to-many):
  opportunity_contact, visit_attendee, activity_attendee,
  permission_master, role_permission, product_alternate, report_role_access

BATCH 6 (audit tables):
  audit_log, login_audit, approval_audit_log

BATCH 7 (history tables):
  lead_status_history, account_status_history, rfq_status_history, quotation_status_history,
  quotation_revision_snapshot, product_price_history, account_credit_history

BATCH 8 (engagement tracking):
  quotation_view_log, call_recording, whatsapp_message_log, document_view_log

BATCH 9 (notification tables):
  notification_log, notification_outbox, user_notification_preference

══════════════════════════════════════════
TASK 2 — SEED DATA
══════════════════════════════════════════
5 Roles: Sales Executive, Sales Manager, Telecaller, Admin, Finance (all is_system_role=true)

5 Lead Sources: Website, Referral, Trade Show, Cold Call, Tender Portal

7 Pipeline Stages (display_order, default_probability_percent):
  1. Qualified=20%, 2. Requirement Gathering=35%, 3. Technical Discussion=50%,
  4. Meeting Scheduled=60%, 5. Demo Conducted=70%, 6. Won=100%, 7. Lost=0%

10 Loss Reasons: Price Too High, Lost to Competitor, No Budget, Requirement Mismatch,
  No Response, Project Cancelled, Long Decision Cycle, Technical Gap, Relationship Issue, Other

5 Tax Rates: GST 5%, GST 12%, GST 18%, GST 28%, IGST 18%

Permission Master — insert all module × action combinations:
  Modules: Lead, Account, Contact, Opportunity, RFQ, Quotation, Activity, Task,
           FollowUp, CustomerVisit, Product, Report, Settings, Dashboard
  Actions: View, Create, Edit, Delete, Approve, Export

Default role_permission matrix:
  Sales Executive: View+Create+Edit on Lead/Account/Contact/Opportunity/RFQ/Activity/Task/FollowUp/CustomerVisit
  Sales Manager:   All of above + Approve on Quotation + View on Reports + Edit on all modules
  Finance:         View on most + Edit credit_limit on Account + Approve on Quotation
  Admin:           ALL permissions
  Telecaller:      View+Create+Edit on Lead; View on Account/Contact

══════════════════════════════════════════
TASK 3 — AUTH APIS
══════════════════════════════════════════
POST /api/auth/login:
  - bcrypt compare password
  - On success: INSERT user_session (user_id, login_at, ip_address, device_type); return JWT {user_id, role_id, role_name, permission_set, territory_id}
  - On fail: INSERT login_audit (attempted_email, user_id or null, status, ip_address)
  - After 5 consecutive failures within 1 hour: set user.is_active=false; notify Admin via notification_log

POST /api/auth/logout:
  - UPDATE user_session SET logout_at=NOW() WHERE user_id=:id AND logout_at IS NULL

GET /api/auth/me:
  - Return user profile + role + permissions

authMiddleware:
  - Verify JWT Bearer token; check user.is_active=true; attach user to request context

permissionMiddleware(module, action):
  - Query role_permission JOIN permission_master
  - Return 403 { error: 'Insufficient permissions', required: 'Module:Action' } if not granted

══════════════════════════════════════════
TASK 4 — SETTINGS MODULE APIS
══════════════════════════════════════════
All require: authMiddleware + permissionMiddleware('Settings','View') minimum

GET/POST/PUT/DELETE /api/settings/users
  - POST: bcrypt hash temp password; email invite notification
  - PUT deactivate: is_active=false; UPDATE user_session SET is_forced_logout=true WHERE logout_at IS NULL;
    reassign open leads + opportunities to reporting_manager_id

GET/POST/PUT /api/settings/roles
  - PUT: save role_permission (delete existing rows for role_id, re-insert from matrix)
  - Cannot delete role assigned to active users

GET/POST/PUT/DELETE /api/settings/territories
GET/POST/PUT/DELETE /api/settings/lead-sources
GET/POST/PUT/DELETE /api/settings/pipeline-stages
  - Include: PUT /api/settings/pipeline-stages/bulk-order [{id, display_order}] for drag-reorder
GET/POST/PUT/DELETE /api/settings/loss-reasons
GET/POST/PUT/DELETE /api/settings/tax-master

══════════════════════════════════════════
TASK 5 — SETTINGS FRONTEND SCREENS
══════════════════════════════════════════
Reuse existing table/modal/form components.

Users List:
  Table: Name, Email, Role, Territory, Status (Active/Inactive toggle), Last Login, Actions
  Actions per row: Edit, Reset Password, Deactivate
  Filter: Role, Status, Territory

Add/Edit User modal:
  Fields: full_name, email, phone, role_id (dropdown), territory_id (dropdown),
          reporting_manager_id (active users only), is_active toggle

Roles & Permissions page:
  Matrix grid — rows=modules, cols=View/Create/Edit/Delete/Approve/Export
  Checkbox per cell; Save writes entire matrix to role_permission table

Other master tables (list + Add/Edit modal pattern):
  Lead Sources: source_name, is_active
  Pipeline Stages: stage_name, default_probability%, drag handle for display_order reorder
  Loss Reasons: reason_text, applies_to_module, is_active
  Tax Master: tax_name, tax_percent, hsn_code, effective_from date, is_active

══════════════════════════════════════════
ACCEPTANCE CRITERIA
══════════════════════════════════════════
✓ All 65+ tables created with FK integrity
✓ Seed data present (5 roles, 7 stages, 5 sources, 10 loss reasons, 5 tax rates)
✓ POST /api/auth/login returns JWT with role+permissions
✓ Sales Executive → GET /api/settings/roles → 403
✓ Admin → GET /api/settings/roles → 200
✓ Deactivated user token rejected on next API call
✓ All Settings CRUD screens load and save correctly
✓ Pipeline stages drag-reorder saves new display_order
```
