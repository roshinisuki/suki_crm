# Suki CRM Worklog — 2026-06-05

## 1. Notification System Technical Debt Resolution
- **Database Schema Update:** Added a new `link` column to the `Notification` model to allow notifications to directly link to relevant pages (e.g., `/marketing-log`).
- **Preference-Aware Utility:** Implemented `dispatchNotification` and `dispatchNotificationsToMany` backend utilities that respect user opt-out preferences and prevent unnecessary database writes.
- **Server-Sent Events (SSE) Migration:** Built a real-time SSE endpoint at `app/api/notifications/sse/route.ts` to replace the heavy polling mechanism, significantly reducing database load.
- **UI Enhancements:** Updated the `DashboardHeader` to use the new SSE stream. Fixed dynamic Toast notification colors (success, error, warning), added a "CLEAR ALL" button, and made notifications clickable for direct routing.

## 2. Bug Fixes & Stability
- **React State Warning Fix:** Resolved a `Cannot update a component (ToastProvider) while rendering a different component` error in `DashboardHeader` by decoupling the `toast()` side-effect from the React state updater loop.
- **Build Error Resolution:** Fixed multiple `npm run build` TypeScript compilation errors in `app/actions/visits.ts`, `InboundCheckInModal.tsx`, and `OutboundCheckInModal.tsx` caused by orphaned references to deleted fields (`approvalStatus`, `requiresApproval`, `visitMetadata`). Removed dead code and synced frontend types with the updated backend signature.
- **SMTP Authentication Fix:** Investigated an email delivery failure (`535-5.7.8 Username and Password not accepted`) and provided instructions on migrating to a Google App Password due to Google deprecating basic password authentication for SMTP.
- **Deployment Ready:** Successfully executed `npm run build` and ensured the project is completely free of TypeScript and compilation errors, preparing it for production deployment.

## 3. Comprehensive Codebase Bug Audit
- Launched an extensive parallel bug audit across the entire codebase utilizing 5 specialized agents.
- Scanned Middleware, Prisma Schema, Server Actions, API routes, Auth flows, and UI Components.
- Identified over **50 bugs**, classifying them into Critical, Warning, and Minor categories.
- **Key Critical Discoveries Included:**
  - JWT signature verification missing in middleware (role-bypass vulnerability).
  - Hardcoded fallback JWT secrets in production logic.
  - Inactivity logout failing to clear the actual JWT cookie.
  - Broken access control allowing users to check-out other executives' visits.
  - Hardcoded passwords for auto-created customer accounts.
- Detailed audit logs are preserved in internal system artifacts for future technical debt sprints.
