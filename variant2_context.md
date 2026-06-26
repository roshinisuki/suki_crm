# Variant 2 — Professional CRM: Context Notes
> Read from: CRM_Variant2_Professional_BRD.docx + CRM_Variant2_EndToEnd_Flow.docx
> Purpose: Reference for implementation planning — DO NOT implement until instructed

---

## 1. What Variant 2 Is
Manufacturing B2B Sales CRM for industrial products (machinery, components, bearings, pumps, valves).
13 Core Modules across a technically complex B2B sales cycle: RFQs → Engineering Review → Costing → Formal Quotations.

---

## 2. All 13 Modules
1. Dashboard (My Dashboard + Sales Manager Dashboard)
2. Leads
3. Accounts (Customers)
4. Contacts
5. Activities
6. Tasks
7. Follow Ups
8. Customer Visits
9. Product Catalogue
10. Sales Pipeline (Opportunities)
11. RFQ Management
12. Quotation Management
13. Reports
14. Settings

---

## 3. Key Database Tables (from BRD)

### Core / Master
- `users` — user_id, full_name, email, phone, role_id, territory_id, reporting_manager_id, is_active, last_login_at
- `roles` — role_id, role_name, permission_set (JSON), is_system_role
- `lead_source_master` — source_id, source_name, is_active
- `pipeline_stage_master` — stage_id, stage_name, display_order, default_probability_percent, is_active
- `notification_rule` — rule_id, trigger_event, notify_role_id, channel (In-App/Email/SMS/WhatsApp), is_active
- `email_template` / `whatsapp_template` — template_id, name, channel, subject, body_content, is_active
- `product_category` — referenced from Settings

### Lead Module
- `lead` — lead_id, company_name, contact_person, designation, phone, email, industry, lead_source_id, territory_id, assigned_to, lead_status, estimated_value, product_interest, lost_reason_id, notes, created_at

### Account Module
- `account` — account_id, company_name, gstin, industry, territory_id, assigned_to, account_status (Prospect/Active/Inactive/Lost), credit_limit, credit_terms_days, annual_revenue
- `account_document` — polymorphic document store for accounts

### Contact Module
- `contact` — contact_id, account_id, full_name, designation, department, phone, email, is_primary_contact, is_decision_maker

### Activity Module
- `activity` — activity_id, related_to_type, related_to_id, activity_type (Call/Email/WhatsApp/Visit/Meeting/Demo), scheduled_at, actual_at, outcome, next_action, assigned_to, whatsapp_template_used, meeting_attendees (TEXT — gap), recording_url

### Task Module
- `task` — task_id, related_to_type, related_to_id, task_title, description, assigned_to, due_date, priority (Low/Medium/High/Critical), task_status (Open/In Progress/Completed/Cancelled/Overdue), created_by

### Follow Up Module
- `follow_up` — followup_id, related_to_type, related_to_id, followup_type (Call/Email/Visit/WhatsApp), scheduled_datetime, purpose_notes, assigned_to, followup_status (Pending/Completed/Overdue/Cancelled), outcome_notes, next_followup_id (self-ref), created_at

### Customer Visit Module
- `customer_visit` — visit_id, account_id, contact_ids (TEXT — gap), visited_by, visit_date, visit_type (Planned/Unannounced), purpose, visit_status (Planned/Checked In/Completed/Missed), checkin_time, checkout_time, gps_location, outcome_notes, next_action

### Product Catalogue Module
- `product_category` — category_id, category_name, description, is_active
- `product` — product_id, category_id, product_code, product_name, hsn_code, base_price, unit_of_measure, lead_time_days, is_active, datasheet_url, brochure_url, technical_specs (JSON)
- `product_document` — product_id, document_type, file_name, file_path

### Sales Pipeline (Opportunity) Module
- `opportunity` — opportunity_id, lead_id (nullable), account_id, contact_id (primary — gap), title, stage, probability_percent, estimated_value, expected_close_date, competitor_id (gap), territory_id, assigned_to, lost_reason_id, notes
- `opportunity_stage_history` — history_id, opportunity_id, from_stage, to_stage, changed_by, changed_at, days_in_previous_stage

### RFQ Management Module
- `rfq` — rfq_id, opportunity_id, account_id, contact_id, product_id, quantity, target_price, delivery_date, technical_specs, rfq_status (Received/Costing Pending/Costed/Quotation Created/Closed), assigned_to, received_date
- `rfq_costing` — costing_id, rfq_id, raw_material_cost, machining_cost, overhead_cost, margin_percent, costed_price, costed_by, costed_at, costing_notes, is_approved
- `rfq_document` — rfq_id, document_type (Drawing/Spec Sheet), file_name, file_path

### Quotation Management Module
- `quotation` — quotation_id, rfq_id, opportunity_id, account_id, contact_id, quotation_code, revision_number, quotation_status (Draft/Sent/Accepted/Rejected/Expired/Cancelled), validity_days, discount_percent, terms_and_conditions, sent_at, responded_at, final_amount, total_amount
- `quotation_line_item` — line_id, quotation_id, product_id, description, quantity, unit_price, tax_percent, total_price
- `quotation_approval` — approval_id, quotation_id, requested_by, approver_id, approval_status, requested_at, decided_at, decision_notes

### Sales Target Module
- `sales_target` — target_id, user_id, territory_id, target_period (Monthly/Quarterly/Yearly), target_amount, achieved_amount, target_start_date, target_end_date

### Reports Module
- `report_definition` — report_id, report_name, base_module, filter_config (JSON), sort_config (JSON), is_scheduled, schedule_config, created_by

---

## 4. Schema Gaps (from gap-fill SQL you shared)

### Category 1 — Missing Master Tables
| Table | Why needed |
|---|---|
| `territory` | Referenced in lead, account, users, sales_target — never defined |
| `competitor` | Referenced in opportunity.competitor_id — never defined |
| `loss_reason_master` | Referenced in lead, opportunity, quotation — never defined |
| `communication_template` | Unified Email/WhatsApp/SMS template store |
| `document` | Generic polymorphic document store (RFQ/Quotation/Visit all use single varchar paths) |
| `tax_master` | GST slab master (quotation line item has free-floating tax_percent) |
| `custom_field_definition` + `custom_field_value` | Custom fields per module |
| `user_session` | Login/session tracking (only last_login_at exists today) |

### Category 2 — Missing Junction Tables
| Table | Why needed |
|---|---|
| `opportunity_contact` | Opportunity has 1 primary_contact; needs M:M with stakeholder roles |
| `visit_attendee` | customer_visit.contact_ids is a TEXT anti-pattern |
| `activity_attendee` | activity.meeting_attendees is a TEXT anti-pattern |
| `permission_master` + `role_permission` | roles.permission_set is a JSON blob — not relational |
| `product_alternate` | Auto-suggest alternatives for discontinued products |
| `report_role_access` | Scope reports by role/territory for row-level security |

### Category 3 — Missing Audit Tables
| Table | Why needed |
|---|---|
| `audit_log` | System-wide field-level audit (only lead_activity_log exists today) |
| `login_audit` | Failed login / brute-force detection |
| `approval_audit_log` | Multi-cycle approval history for quotations |

### Category 4 — Missing History Tables
| Table | Why needed |
|---|---|
| `lead_status_history` | SLA reporting — how long leads sit in each status |
| `account_status_history` | When/why account moved Prospect → Active → Inactive |
| `rfq_status_history` | How long RFQs sit in Costing Pending — aging KPIs |
| `quotation_status_history` | Quotation lifecycle tracking |
| `quotation_revision_snapshot` | Full JSON snapshot of each revision |
| `product_price_history` | Price changes should not rewrite past quotation context |
| `account_credit_history` | Finance compliance — who approved credit limit changes |

### Category 5 — Missing Activity/Engagement Tables
| Table | Why needed |
|---|---|
| `quotation_view_log` | Track when customer opens shared quotation PDF |
| `call_recording` | Recording URL + transcript per activity |
| `whatsapp_message_log` | Two-way WhatsApp conversation history |
| `document_view_log` | Sales engagement signal — when customer opens datasheet/brochure |

### Category 6 — Missing Notification Tables
| Table | Why needed |
|---|---|
| `notification_log` | 40+ BRD automation rules have nowhere to persist notifications |
| `notification_outbox` | Retry queue for failed Email/WhatsApp/SMS sends |
| `user_notification_preference` | Per-user channel/event preferences |

---

## 5. End-to-End Flow Summary (15 Steps)
**Scenario:** Industrial bearings inquiry → Quotation Accepted

| Step | Module | Key Event |
|---|---|---|
| 1 | Leads | Lead created (Website form), auto-assigned to Sales Exec, first follow-up auto-created |
| 2 | Leads | Lead qualified, status → Qualified |
| 3 | Leads | Lead converted → Account + Contact + Opportunity created |
| 4 | Sales Pipeline | Opportunity stage = New/Prospect, territory assigned |
| 5 | Activities | Technical call logged, product interest confirmed |
| 6 | Tasks | Internal task created for technical team to prepare product datasheet |
| 7 | Follow Ups | Follow-up scheduled post-task completion |
| 8 | Customer Visit | Site visit planned, checked in via GPS, outcome logged |
| 9 | RFQ | RFQ raised from Opportunity, technical specs and drawing attached |
| 10 | RFQ | Costing completed by technical team, costed price approved |
| 11 | Quotation | Quotation created from RFQ costing, line items added, terms set |
| 12 | Quotation | Discount check — if within threshold, no approval needed |
| 13 | Quotation | Quotation PDF sent to customer via integrated email |
| 14 | Follow Ups + Activities | T+2 post-send follow-up call, next follow-up auto-scheduled |
| 15 | Quotation | Customer accepts → Quotation=Accepted, Opportunity=Won, Account=Active, RFQ=Closed, Follow-ups cancelled, target KPIs updated |

---

## 6. Key Automation Rules (BRD summary)
- Auto-assign new leads based on territory/product category
- Auto-create first Follow Up on every new Lead
- Auto-mark Follow Ups Overdue (nightly job)
- Auto-escalate overdue Follow Ups on high-value opportunities to Sales Manager
- Auto-create Follow Up 2 days after Quotation is sent
- Auto-check discount % against threshold before allowing Send
- Auto-update RFQ status when Quotation is created/sent
- Auto-promote Account from Prospect → Active when Quotation is Accepted
- Auto-cancel open Follow Ups when a deal is Won/Lost
- Auto-roll up Won value into Sales Target KPIs
- Auto-deactivate user login when is_active = false
- Auto-reassign open records to reporting manager when user is deactivated

---
*Saved for implementation planning. Awaiting instructions.*
