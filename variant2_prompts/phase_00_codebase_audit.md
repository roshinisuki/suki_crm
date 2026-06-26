# Phase 0 — Codebase Audit (Run Before ANY Phase)
**Priority:** 🔴 Mandatory — Do this before implementing anything

> This is the READ-ONLY audit step. Do NOT write any code yet.
> After completing this audit, paste the output as context into your phase prompt.

---

## Prompt

```
You are about to implement a phase of Variant 2 Professional CRM.
Before writing a single line of code, you MUST audit the existing codebase.
Your job is to EXTEND and ENHANCE — not rebuild, not restyle, not change themes.

══════════════════════════════════════════
STEP 1 — READ THE PRISMA SCHEMA
══════════════════════════════════════════
Read: prisma/schema.prisma

For each model, note:
  - Model name
  - All field names and types
  - All relations (FK references)
  - Any missing fields compared to what Variant 2 BRD requires

Output a table like:
| Model | Exists? | Missing Fields | Missing Relations |
|-------|---------|---------------|-------------------|
| lead  | ✅      | lead_score, is_duplicate_of | → loss_reason_master |

══════════════════════════════════════════
STEP 2 — READ THE UI THEME & COLORS
══════════════════════════════════════════
Read these files to understand the existing design system:
  - app/globals.css
  - tailwind.config.ts (or tailwind.config.js)
  - lib/theme-accents.ts  (if exists)
  - components/ui/  (all files — understand available components)

Note down:
  - Primary color(s) used (hex or Tailwind class names)
  - Background colors (sidebar, page, cards)
  - Text colors
  - Border/radius styles
  - Status pill colors (how are Active, Inactive, etc. styled)
  - Badge colors (how are priorities, stages, categories styled)
  - Table styles (which component is the standard table)
  - Modal styles (which component is the standard modal)
  - Button variants (primary, secondary, danger, ghost)
  - Form input styles

RULE: Use these EXACT same colors and components in every new screen.
      NEVER introduce new color values or new component patterns.

══════════════════════════════════════════
STEP 3 — READ EXISTING MODULE PAGES
══════════════════════════════════════════
Read one representative page from each of these modules to understand the pattern:
  - app/(dashboard)/leads/page.tsx                   ← list page pattern
  - app/(dashboard)/customer-master/page.tsx         ← account list pattern
  - app/(dashboard)/sales-pipeline/page.tsx          ← pipeline list pattern
  - app/(dashboard)/sales-pipeline/[id]/page.tsx     ← detail page pattern
  - app/(dashboard)/settings/users/page.tsx          ← settings page pattern

For each file, note:
  - How data is fetched (useEffect, fetch, SWR, React Query?)
  - How the list table is structured (which component?)
  - How modals are opened and closed (useState pattern?)
  - How forms are submitted (controlled inputs, form libraries?)
  - How loading and error states are handled
  - How status pills/badges are styled (inline className or component?)
  - How pagination works (if present)
  - How filters are applied

RULE: All new pages MUST follow the same patterns found here.
      No new state management libraries. No new fetch patterns.

══════════════════════════════════════════
STEP 4 — READ EXISTING API ROUTES
══════════════════════════════════════════
Read one representative API route from each module:
  - app/api/leads/route.ts
  - app/api/catalogue/products/route.ts
  - app/api/negotiations/[id]/route.ts  (or similar complex route)

Note:
  - How auth is checked (middleware pattern?)
  - How Prisma queries are structured
  - How errors are returned (status codes + message format)
  - How pagination is implemented (skip/take?)
  - How response JSON is structured { data: [], total: N } or different?

RULE: All new API routes MUST use the same auth pattern, error format, and response structure.

══════════════════════════════════════════
STEP 5 — READ EXISTING COMPONENTS
══════════════════════════════════════════
Read these shared components:
  - components/CollapsibleSidebar.tsx     ← navigation structure
  - components/DashboardHeader.tsx        ← page header pattern
  - components/ui/Modal.tsx              ← modal component API
  - components/ui/PageShell.tsx          ← page wrapper
  - components/ui/SummaryCard.tsx        ← KPI card pattern
  - components/Logo.tsx                  ← logo component
  - components/GlobalLoadingProvider.tsx ← loading pattern

Note the props interface of each component so you use them correctly.

══════════════════════════════════════════
STEP 6 — READ THE NAVIGATION STRUCTURE
══════════════════════════════════════════
Read: components/CollapsibleSidebar.tsx (or equivalent nav file)

Note:
  - All existing nav items and their routes
  - How nav items are grouped/sectioned
  - How active state is highlighted
  - How icons are used (which icon library: lucide-react?)

══════════════════════════════════════════
STEP 7 — IDENTIFY WHAT ALREADY EXISTS vs WHAT'S MISSING
══════════════════════════════════════════
Based on your audit, create a checklist:

FOR THE PHASE YOU ARE ABOUT TO IMPLEMENT, note for each item:

Database:
  ✅ Table exists with all needed fields → no migration needed
  ⚠️ Table exists but missing fields → add columns only
  ❌ Table missing entirely → create new migration

API Routes:
  ✅ Route exists and works → reuse or extend
  ⚠️ Route exists but missing logic → add to existing handler
  ❌ Route missing → create new

UI Screens:
  ✅ Screen exists with correct behavior → no change
  ⚠️ Screen exists but missing features → add to existing page
  ❌ Screen missing → create new (following existing patterns)

══════════════════════════════════════════
STEP 8 — CONFIRM YOUR IMPLEMENTATION RULES
══════════════════════════════════════════
Before writing code, confirm these rules with yourself:

☐ I have read the existing Prisma schema
☐ I know the exact color palette and Tailwind classes in use
☐ I know which shared UI components to reuse
☐ I know the exact fetch/state pattern used in existing pages
☐ I know the exact error/response format used in existing APIs
☐ I will NOT change any existing UI colors or theme
☐ I will NOT introduce new component libraries
☐ I will NOT rebuild screens that already work
☐ I will ONLY add what is genuinely missing
☐ I will follow the EXACT same code style as existing files

══════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════
After completing this audit, produce a summary like:

AUDIT SUMMARY — Phase [N]: [Phase Name]

Theme:
  Primary color: [value]
  Card background: [value]
  Status pill pattern: [className pattern]
  Standard table component: [component name]
  Standard modal component: [component name]

Fetch pattern: [useEffect + fetch / SWR / React Query]
Auth pattern: [how checked in API routes]
Error format: [{ error: string } / { message: string }]
Pagination: [skip/take Prisma / page+limit / cursor]

What exists (no change needed):
  - [list items]

What needs extension (add to existing):
  - [list items]

What needs creation (new):
  - [list items]

THEN proceed to implement ONLY the missing/extension items,
using the same patterns, colors, and components as the existing codebase.
```

---

## How to use this in your workflow

1. **Open a fresh AI agent session**
2. Paste `00_system_context.md` first
3. Paste this `phase_00_codebase_audit.md` prompt
4. Let the agent read and audit the codebase
5. Copy the **AUDIT SUMMARY** output
6. Open a new session (or continue)
7. Paste `00_system_context.md` + **AUDIT SUMMARY** + the specific phase prompt (e.g., `phase_02_leads_module.md`)
8. Now the agent implements with full awareness of what exists
