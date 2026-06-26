# SUKI CRM — Worklog (25 June 2026)

## Goal
Quotation Flow and List Fix: ensure quotation list shows data correctly, guide users in the Proposal stage, and link quotations to opportunities.

## What was changed

### 1. Quotation list API + UI
- `app/api/quotations/route.ts` — GET already filters by `companyId` and normalizes `status` from the query string. Response shape is `{ success, data, total, page, totalPages }`. No functional changes required.
- `app/(dashboard)/quotations/page.tsx` —
  - Added `error` state with user-visible message.
  - Improved empty state: icon, explanatory text, status-aware message, and a **Create First Quotation** CTA.
  - Parses `data.data ?? []` defensively on fetch.

### 2. Proposal stage quotation guide
- `app/(dashboard)/sales-pipeline/[id]/opportunity-detail/page.tsx` —
  - Added `linkedQuotations` state and `fetchLinkedQuotations` fetcher.
  - Added new `ProposalQuotationGuide` component with lifecycle states:
    - **No quotation** — create RFQ or direct quotation.
    - **Draft** — view / send to customer.
    - **Sent** — view / mark accepted / negotiate.
    - **UnderReview** — view / accept / negotiate.
    - **Accepted** — mark deal as Won.
  - Integrated the banner at the top of the Proposal stage form.

### 3. New API endpoints
- `app/api/opportunities/[id]/quotations/route.ts` — returns all non-deleted quotations linked to a deal, ordered newest first. Enforces auth + `companyId` + row-level scope for `SalesExecutive`.
- `app/api/opportunities/[id]/context/route.ts` (user created) — compact opportunity context used for pre-filling new RFQs and quotations.

### 4. TypeScript fixes
- `app/api/opportunities/[id]/quotation-context/route.ts` — cast Prisma query and callback parameters to `any` to resolve three TS errors.

### 5. Supporting changes (user edits)
- `app/(dashboard)/quotations/new/page.tsx` — switched to new `/api/opportunities/[id]/context`, added user assignment dropdown, context error banner, and fallback to manual selection.
- `app/api/opportunities/[id]/stage-change/route.ts` — merged Meeting & Demo stage labels, allowed jump to Won with an accepted quotation, updated follow-up map.
- `app/(dashboard)/sales-pipeline/[id]/opportunity-detail/page.tsx` — merged Meeting & Demo form sections, added Create RFQ / Direct Quotation header actions, updated Won gating.

## Verification
- `npx tsc --noEmit` — **exit code 0** (no errors).

## Next steps
- Run the dev server and smoke-test:
  - Create a quotation from the Proposal stage guide.
  - Verify the list page refreshes and shows the new quotation.
  - Send the quotation and mark it accepted, then click **Mark Deal as Won**.
