# Suki CRM - Developer Daily Recap (May 28)

Hey! Here's a quick recap of the UI adjustments, visual cleanups, and real-time database integrations I got done on the dashboard and Suki CRM pages today. It was a highly productive session and the application feels incredibly solid and professional now.

---

### 🎨 Dashboard Layout & Styling Tweaks
* **Grid Cleanup**: Got rid of the 6 mini KPI cards from the right sidebar to clear up clutter.
* **Subscriptions Shift**: Moved the Subscriptions ring chart over to that empty right sidebar space. It fits compact and looks extremely sharp now.
* **Dynamic Visit Activity Graph**: 
  * Replaced the main wide workspace with a dynamic SVG Line Graph for **Marketing Visit Activity**.
  * It now queries actual check-in data from the database (both customer office visits and outbound field visits) for the past 6 months.
  * Made the Y-axis scale dynamically depending on the maximum visit counts, and added a custom hover-tooltip card over the latest month's point (with boundary checks so it never clips off the right side of the screen).
* **Subscriptions Ring Refresh**: Refactored the concentric ring chart UI (removed the bulky center label, floated the segment percentages outside the rings, and replaced the huge table legend with a compact, lowercase 2-column grid bullet list).
* **Top Banner KPIs**: Moved the 5 missing grid KPI metrics (Team Members, Accounts, Visits Today, Inbound, Outbound) into the bottom row of the top dark performance banner, utilizing a flex-wrap container so they flow beautifully.

### ⚡ Actionable Pending Subscriptions
* **Table Integration**: Auto-compiled all approved customers without subscription plans and listed them as virtual **`Pending`** rows directly in the main Subscriptions table.
* **Top Sorting**: Wrote a quick sorting rule that automatically bubbles these pending accounts to the **absolute top** of the Subscriptions table so they are immediately visible.
* **Setup Plan Shortcut**: Added a quick `+ Setup Plan` button inside the row that opens the plan creation form pre-filled with the customer’s information in one click. 
* **KPI Alignment**: Tied these virtual rows into the "Pending Plans" stats card count at the top.

### 🔔 Header Notification Popup System
* **Deleted Inline Banners**: Removed the flashing yellow and blue warning boxes from the top of the dashboard and subscriptions pages to keep the interface clean.
* **Toast Alert Popup**: Created an elegant slide-in toast popup (**`One message arrived`**) in the top right. It rings and pops up whenever a visitor checks in/out, or a new system notification is recorded. Clicking on it redirects you directly to the relevant action panel.
* **Initial Load Protection**: Fixed a classic bug by adding a closure mount filter so that **old unread notifications are completely ignored on page load/refresh** (so you only get a toast alert for actual live, real-time updates).
* **Real-time DB Triggers**: Added logic inside inbound check-in, inbound check-out, and outbound check-out actions to automatically write `prisma.notification` records, broadcasting them instantly.
* **Clear All Purge**: Built a `DELETE /api/notifications` API endpoint and added a red `✕ Clear all` option in the dropdown header to quickly wipe database notifications.

### 👤 Professional Initials Avatars
* **Removed Mock Photos**: Removed the unprofessional stock images from the header profile button and the sidebar footer.
* **Smart Initials**: Wrote an initials extractor (strips special characters like dots, so `Roshini.V` becomes `RV`, `System Admin` becomes `SA`).
* **Visuals**: Housed the text inside beautiful Indigo-Purple and Navy gradients with interactive zoom hover states.

### 📊 Marketing Log Adjustments
* **Timings Column Employee Names**: Appended `(by [Employee Name])` next to check-in and checkout timings on all outbound field logs.
* **Customer-Employee Swap**: For **Outbound (field) logs alone**, swapped the column layout. The bold top title displays the **Employee (Executive) Name** and the bottom small text shows the **Customer Name**. Inbound office logs retain their standard format.
