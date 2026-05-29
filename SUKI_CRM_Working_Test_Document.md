# Project: SUKI CRM
## Document Type: Working Test / QA Checklist
### Version: 1.0
### Date: May 28, 2026
### Prepared by: SUKI CRM Developer / Antigravity AI

---

## OVERVIEW & QA GUIDELINES

This document serves as the master Quality Assurance (QA) and Manual Testing Checklist for **SUKI CRM**. It covers all user roles (Admin, Marketing Lead, Marketing Executive, and Customer), all modules, validations, edge cases, responsive behaviors, and database-state operations in a clear tabular format.

### Testing Instructions:
1. Every test point must be executed in both **Desktop (1280px+)** and **Mobile (375px)** screen sizes unless a specific device constraint is noted.
2. Complete the step-by-step actions exactly as described in the tables.
3. Verify that the actual behavior matches the expected result.
4. Mark **[x]** under the **Pass** or **Fail** column based on the results.
5. Notes can be added in the final column for reporting any observed discrepancies.

---

## SECTION 1: LOGIN PAGE
*Section Subtotal: 18 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **LOGIN-001** | Navigate to `/login` in a fresh incognito browser window. | Page loads correctly with logo, company name ("SUKI CRM"), and login form. | [ ] | [ ] | |
| **LOGIN-002** | Click on the Email input field and type `admin@sukisoftware.com`. | Email field accepts text input and displays characters. | [ ] | [ ] | |
| **LOGIN-003** | Click on the Password field and type `SukiSecurePassword2026!`. | Password field accepts input and hides characters by default. | [ ] | [ ] | |
| **LOGIN-004** | Click the Show/Hide password toggle button next to the password input. | Password characters are revealed; clicking again hides them. | [ ] | [ ] | |
| **LOGIN-005** | Click the "Remember Me" checkbox. | "Remember Me" checkbox can be successfully checked and unchecked. | [ ] | [ ] | |
| **LOGIN-006** | Click the "Forgot Password?" link on the login form. | User is navigated to the forgot password page. | [ ] | [ ] | |
| **LOGIN-007** | Clear either Email or Password and check button. Fill both. | Login button is enabled only when both fields are filled. | [ ] | [ ] | |
| **LOGIN-008** | Enter valid Admin credentials and click "Login". | Authenticates successfully and redirects to Admin Dashboard. | [ ] | [ ] | |
| **LOGIN-009** | Enter valid Marketing Lead credentials and click "Login". | Authenticates successfully and redirects to Marketing Lead Dashboard. | [ ] | [ ] | |
| **LOGIN-010** | Enter valid Marketing Executive credentials and click "Login". | Authenticates successfully and redirects to Marketing Executive Dashboard. | [ ] | [ ] | |
| **LOGIN-011** | Enter valid Customer credentials and click "Login". | Authenticates successfully and redirects to Customer Portal. | [ ] | [ ] | |
| **LOGIN-012** | Enter correct email but incorrect password and click "Login". | Displays "Invalid credentials" error message. | [ ] | [ ] | |
| **LOGIN-013** | Enter unregistered email address and a password, then click "Login". | Displays appropriate email/user not registered error. | [ ] | [ ] | |
| **LOGIN-014** | Enter credentials of a pending/inactive user account, then click "Login". | Displays "Account not active" error message. | [ ] | [ ] | |
| **LOGIN-015** | Focus the email field, leave it completely empty, fill password, and submit. | Displays standard browser or application email validation error. | [ ] | [ ] | |
| **LOGIN-016** | Fill email, leave the password field completely empty, and submit. | Displays standard browser or application password validation error. | [ ] | [ ] | |
| **LOGIN-017** | Enter an invalid email format (e.g. `test@invalid`) and submit. | Shows email format validation error. | [ ] | [ ] | |
| **LOGIN-018** | Enter non-company email (not `@sukisoftware.com`) for an internal employee account. | Shows domain restriction error. | [ ] | [ ] | |

---

## SECTION 2: FORGOT PASSWORD FLOW
*Section Subtotal: 15 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **FORGOT-001** | On the login page, click the "Forgot Password?" link. | Opens the forgot password page. | [ ] | [ ] | |
| **FORGOT-002** | Type `test@sukisoftware.com` inside the Email field. | Email field accepts text input. | [ ] | [ ] | |
| **FORGOT-003** | Inspect the recovery form layout. | Submit button is visible and active once email is entered. | [ ] | [ ] | |
| **FORGOT-004** | Click the Submit button with the email field left blank. | Blocks submission and shows validation error. | [ ] | [ ] | |
| **FORGOT-005** | Enter an unregistered email (e.g. `unreg@suki.com`) and click Submit. | Shows appropriate message confirmation (preventing user enumeration). | [ ] | [ ] | |
| **FORGOT-006** | Enter a valid registered email and click Submit. | Shows "Reset link sent to your email" message. | [ ] | [ ] | |
| **FORGOT-007** | Open the user's email client and check inbox. | Reset email arrives with a valid link. | [ ] | [ ] | |
| **FORGOT-008** | Click the received reset link in the email. | Opens the Reset Password page. | [ ] | [ ] | |
| **FORGOT-009** | Inspect the Reset Password page layout. | Shows: New Password, Confirm Password, and Submit button. | [ ] | [ ] | |
| **FORGOT-010** | Enter different passwords in the New and Confirm fields, then submit. | Blocks submission and shows mismatched passwords error. | [ ] | [ ] | |
| **FORGOT-011** | Enter a weak password (e.g. `12345`) and click Submit. | Blocks submission and shows password strength error. | [ ] | [ ] | |
| **FORGOT-012** | Enter valid matching strong passwords and click Submit. | Displays success message: "Password updated successfully." | [ ] | [ ] | |
| **FORGOT-013** | Attempt to log in to `/login` using the old password. | Login fails; old password is deactivated. | [ ] | [ ] | |
| **FORGOT-014** | Attempt to log in to `/login` using the newly set password. | Logs in successfully and redirects to dashboard. | [ ] | [ ] | |
| **FORGOT-015** | Click a previously used or expired reset link. | Displays "This link has expired" error message. | [ ] | [ ] | |

---

## SECTION 3: ACCOUNT ACTIVATION FLOW (New Users)
*Section Subtotal: 8 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **ACTIVATE-001** | Check inbox of a newly created internal or customer user account. | Activation email arrives with a valid SET PASSWORD link. | [ ] | [ ] | |
| **ACTIVATE-002** | Click the activation link in the email. | Opens the `/activate-account` page. | [ ] | [ ] | |
| **ACTIVATE-003** | Verify the `/activate-account` page elements. | Page shows: New Password, Confirm Password, and Submit button. | [ ] | [ ] | |
| **ACTIVATE-004** | Enter a weak password (e.g. `suki`) in both fields and click Submit. | Form rejects it and shows password strength error. | [ ] | [ ] | |
| **ACTIVATE-005** | Enter a matching strong password in both fields and click Submit. | Activates the account in DB and updates status to active. | [ ] | [ ] | |
| **ACTIVATE-006** | Observe behavior after successful activation submission. | User is automatically redirected to login page. | [ ] | [ ] | |
| **ACTIVATE-007** | Attempt to log in with the newly activated credentials. | User logs in successfully with new password. | [ ] | [ ] | |
| **ACTIVATE-008** | Click an expired or invalid activation link. | Shows "This link has expired" message. | [ ] | [ ] | |

---

## SECTION 4: ADMIN — SIDEBAR NAVIGATION
*Section Subtotal: 16 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **NAV-001** | Log in as Admin. Click the "Dashboard" menu item. | Navigates to `/admin/dashboard`. | [ ] | [ ] | |
| **NAV-002** | Click the "Users" menu item. | Navigates to `/admin/users`. | [ ] | [ ] | |
| **NAV-003** | Click the "Customers" menu item. | Navigates to `/admin/customers`. | [ ] | [ ] | |
| **NAV-004** | Click the "Marketing Visits" menu item. | Navigates to `/admin/marketing-visits`. | [ ] | [ ] | |
| **NAV-005** | Click the "Visitor Management" menu item. | Navigates to `/admin/visitors`. | [ ] | [ ] | |
| **NAV-006** | Click the "Follow-Ups" menu item. | Navigates to `/admin/follow-ups`. | [ ] | [ ] | |
| **NAV-007** | Click the "Reports" menu item. | Navigates to `/admin/reports`. | [ ] | [ ] | |
| **NAV-008** | Click the "Audit Logs" menu item. | Navigates to `/admin/audit-logs`. | [ ] | [ ] | |
| **NAV-009** | Click the "Settings" menu item. | Navigates to `/admin/settings`. | [ ] | [ ] | |
| **NAV-010** | Click the Profile icon/link. | Navigates to `/profile`. | [ ] | [ ] | |
| **NAV-011** | Click the Notification bell icon. | Opens notification dropdown. | [ ] | [ ] | |
| **NAV-012** | Click the Sign Out button. | Logs out user and redirects to `/login`. | [ ] | [ ] | |
| **NAV-013** | Navigate to `/admin/users` and observe sidebar. | Active menu item ("Users") is visually highlighted. | [ ] | [ ] | |
| **NAV-014** | Click the sidebar toggle collapse button. | Sidebar collapses/expands correctly on toggle. | [ ] | [ ] | |
| **NAV-015** | Verify sidebar layout at 1280px+ screen width. | Sidebar is fully visible on desktop. | [ ] | [ ] | |
| **NAV-016** | Verify sidebar layout at 375px screen width. | Sidebar is hidden; hamburger menu appears to toggle it. | [ ] | [ ] | |

---

## SECTION 5: ADMIN — DASHBOARD
*Section Subtotal: 13 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **DASHBOARD-001** | Navigate to `/admin/dashboard`. | Dashboard page loads successfully without errors. | [ ] | [ ] | |
| **DASHBOARD-002** | Observe the "Total Customers" card count. | Card displays the correct live number of customers in the system. | [ ] | [ ] | |
| **DASHBOARD-003** | Observe the "Total Marketing Visits Today" card count. | Card displays the correct count of logged visits scheduled for today. | [ ] | [ ] | |
| **DASHBOARD-004** | Observe the "Inbound Visitors Today" card count. | Card displays correct live count of visitors checked in but not checked out. | [ ] | [ ] | |
| **DASHBOARD-005** | Observe the "Outbound Visitors Today" card count. | Card displays correct live count of checked-out visitors today. | [ ] | [ ] | |
| **DASHBOARD-006** | Observe the "Pending Follow-Ups" card count. | Card displays the correct live count of unresolved follow-up tasks. | [ ] | [ ] | |
| **DASHBOARD-007** | Observe the "Active Subscriptions" card count. | Card displays the correct count of total active customer subscriptions. | [ ] | [ ] | |
| **DASHBOARD-008** | Verify the header layout. | Global search bar is clearly visible in the header. | [ ] | [ ] | |
| **DASHBOARD-009** | Type a search string and notice key trigger delay. | Search triggers a dropdown search query after a 300ms debounce. | [ ] | [ ] | |
| **DASHBOARD-010** | Enter a search term and view results categorizations. | Dropdown shows matching Customers, Visitors, and Marketing Visits. | [ ] | [ ] | |
| **DASHBOARD-011** | Click on a customer/visit result from the dropdown list. | Navigates the browser directly to the clicked record detail page. | [ ] | [ ] | |
| **DASHBOARD-012** | Type an unmatching query string. | Dropdown displays a clean "No results found" message. | [ ] | [ ] | |
| **DASHBOARD-013** | Clear all text from the search input field. | Dropdown closes and hides immediately. | [ ] | [ ] | |

---

## SECTION 6: ADMIN — USERS PAGE
*Section Subtotal: 18 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **USERS-001** | Navigate to `/admin/users`. | Users page loads successfully with a list of all users. | [ ] | [ ] | |
| **USERS-002** | View the user filters tab section. | Two tabs are visible: "Internal Users" and "Customer Portal Users". | [ ] | [ ] | |
| **USERS-003** | Click the "Internal Users" tab filter. | Lists Admin, Marketing Lead, and Marketing Executive accounts. | [ ] | [ ] | |
| **USERS-004** | Click the "Customer Portal Users" tab filter. | Lists Customer-linked accounts only. | [ ] | [ ] | |
| **USERS-005** | Click "+ Create User" button on the top right. | Create User modal form pops open successfully. | [ ] | [ ] | |
| **USERS-006** | Click between "Internal Employee" and "Customer Portal User" options. | Modal form switches fields dynamically based on selection. | [ ] | [ ] | |
| **USERS-007** | Verify form fields for "Internal Employee". | Displays: Name, Email (@sukisoftware.com), Role (Lead/Executive), Department. | [ ] | [ ] | |
| **USERS-008** | Verify form fields for "Customer Portal User". | Displays: Name, Email, linked Customer selector dropdown. | [ ] | [ ] | |
| **USERS-009** | Click Submit on user creation form with empty fields. | Shows validation errors on all missing fields. | [ ] | [ ] | |
| **USERS-010** | Enter non-company email for Internal and submit. | Blocks submission and shows domain restriction error. | [ ] | [ ] | |
| **USERS-011** | Submit valid internal employee creation form. | Sends activation email with SET PASSWORD link. | [ ] | [ ] | |
| **USERS-012** | Submit valid customer portal user creation form. | Sends activation email with SET PASSWORD link. | [ ] | [ ] | |
| **USERS-013** | Check "Role" dropdown options inside the Create User modal. | Admin role option is not visible in the selector (cannot create Admin from UI). | [ ] | [ ] | |
| **USERS-014** | View users table structure. | List shows: Name, Email, Role, Status badge, Joined Date, Actions. | [ ] | [ ] | |
| **USERS-015** | Click "Edit" in Actions column of a user row. | Opens the Edit User modal pre-filled with user data. | [ ] | [ ] | |
| **USERS-016** | Toggle Deactivate/Activate switch/badge on a user row. | Prompts confirmation and changes user account status in database. | [ ] | [ ] | |
| **USERS-017** | Click "Delete" button on user row. | Shows confirmation dialog; confirming deletes user. | [ ] | [ ] | |
| **USERS-018** | Type in users search/filter bar. | Instantly filters the list by name or email query. | [ ] | [ ] | |

---

## SECTION 7: ADMIN — CUSTOMERS PAGE
*Section Subtotal: 12 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **CUSTOMERS-001** | Navigate to `/admin/customers`. | Page loads successfully displaying the list of all customers. | [ ] | [ ] | |
| **CUSTOMERS-002** | Search a customer name or toggle status filters. | The customers data table filters immediately. | [ ] | [ ] | |
| **CUSTOMERS-003** | Click "+ Add Customer" button. | Opens the Customer Registration form modal. | [ ] | [ ] | |
| **CUSTOMERS-004** | Verify customer registration form fields. | Displays: Name, Email, Phone, Customer Code, Subscription Plan, Status. | [ ] | [ ] | |
| **CUSTOMERS-005** | Submit customer form with required fields missing. | Shows inline validation errors. | [ ] | [ ] | |
| **CUSTOMERS-006** | Enter valid customer details and submit. | Customer is added to DB and appears in the list. | [ ] | [ ] | |
| **CUSTOMERS-007** | Attempt to submit another customer with a duplicate Code. | Blocks submission and shows "Customer Code must be unique" error. | [ ] | [ ] | |
| **CUSTOMERS-008** | Click "Edit" on a customer row, modify details, and save. | Updates customer record in database and refreshes row data. | [ ] | [ ] | |
| **CUSTOMERS-009** | Click "View" (eye icon) on a customer row. | Opens a comprehensive detail modal showing all customer records. | [ ] | [ ] | |
| **CUSTOMERS-010** | Click "Delete" on customer row. | Displays a confirmation warning modal before deleting (Admin-only). | [ ] | [ ] | |
| **CUSTOMERS-011** | Check subscription details on customer list. | Customer's active subscription plan is visible on the row. | [ ] | [ ] | |
| **CUSTOMERS-012** | Verify status indicator badge on customer rows. | Displays correct green active or red/gray inactive status badge. | [ ] | [ ] | |

---

## SECTION 8: ADMIN — MARKETING VISITS PAGE
*Section Subtotal: 10 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **VISITS-001** | Navigate to `/admin/marketing-visits`. | Page loads successfully showing the logged visits. | [ ] | [ ] | |
| **VISITS-002** | Pick start and end dates in the date filter. | Table updates showing only visits that fell within that range. | [ ] | [ ] | |
| **VISITS-003** | Click "+ Log Visit" button. | Opens the Log Visit form modal. | [ ] | [ ] | |
| **VISITS-004** | Verify form fields inside the Log Visit modal. | Displays: Customer, Executive, Date, Check-In, Check-Out, Purpose, Notes, Follow-Up. | [ ] | [ ] | |
| **VISITS-005** | Submit a visit form with the Follow-Up Date left blank. | Visit is saved successfully since Follow-Up Date is optional. | [ ] | [ ] | |
| **VISITS-006** | Submit visit form with empty required fields. | Form blocks submission and displays validation errors. | [ ] | [ ] | |
| **VISITS-007** | Enter valid required fields and click Submit. | Visit record is saved and appears immediately in the table. | [ ] | [ ] | |
| **VISITS-008** | Click "Edit" on a visit record, update purpose/notes, and save. | Correctly saves updates and updates visual table row data. | [ ] | [ ] | |
| **VISITS-009** | Click "Check Out" on an active visit record row. | Automatically stamps current system time as Check-Out Time. | [ ] | [ ] | |
| **VISITS-010** | Click "View details" on a visit row. | Opens details modal displaying full fields and notes. | [ ] | [ ] | |

---

## SECTION 9: ADMIN — VISITOR MANAGEMENT PAGE
*Section Subtotal: 12 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **VISITORS-001** | Navigate to `/admin/visitors`. | Visitor Management page loads with the list of walk-in visitors. | [ ] | [ ] | |
| **VISITORS-002** | Click "+ Add Walk-In" button. | Opens the Walk-In registration form. | [ ] | [ ] | |
| **VISITORS-003** | Verify required fields in Walk-In form. | Displays: Visitor Name, Phone (10 digits), Purpose, Host Employee, Check-In Time. | [ ] | [ ] | |
| **VISITORS-004** | Verify optional fields in Walk-In form. | Displays: Company Name, Email, Pre-Registered flag toggle. | [ ] | [ ] | |
| **VISITORS-005** | Click Submit on an empty Walk-In form. | Shows inline validation error warnings. | [ ] | [ ] | |
| **VISITORS-006** | Enter phone less or more than 10 digits and submit. | Rejects form showing phone formatting error. | [ ] | [ ] | |
| **VISITORS-007** | Enter invalid email format (e.g. `test@invalid`) and submit. | Rejects form showing email formatting error. | [ ] | [ ] | |
| **VISITORS-008** | Enter valid data and submit. | Visitor is recorded and shows up instantly in the visitor list. | [ ] | [ ] | |
| **VISITORS-009** | Click "View" in the Actions column of a visitor row. | Opens a modal displaying complete visitor details. | [ ] | [ ] | |
| **VISITORS-010** | Click "Check Out" on a visitor row. | Stamps current system time as the visitor's outTime in DB. | [ ] | [ ] | |
| **VISITORS-011** | Observe check-out button area after checking out. | Active "Check Out" button disappears or updates to text "Checked Out". | [ ] | [ ] | |
| **VISITORS-012** | Click "Delete" on visitor row (Admin-Only) and confirm. | Deletes visitor from DB and logs action to Audit Logs. | [ ] | [ ] | |

---

## SECTION 10: ADMIN — FOLLOW-UPS PAGE
*Section Subtotal: 11 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **FOLLOWUP-001** | Navigate to `/admin/follow-ups`. | Follow-Ups page loads successfully with sidebar and headers intact. | [ ] | [ ] | |
| **FOLLOWUP-002** | Verify layout on 1280px+ screen resolution. | Follow-ups table fits container perfectly without overflow. | [ ] | [ ] | |
| **FOLLOWUP-003** | Observe table headers and columns. | Shows: Customer, Assigned To, Follow-Up Date, Status, Notes, Actions. | [ ] | [ ] | |
| **FOLLOWUP-004** | Click "+ Create Follow-Up" button. | Opens the follow-up registration form modal. | [ ] | [ ] | |
| **FOLLOWUP-005** | Check form fields inside follow-up scheduler. | Displays: Customer, Follow-Up Date, Notes, Assigned To (Marketing Executive). | [ ] | [ ] | |
| **FOLLOWUP-006** | Click Submit on follow-up form with empty fields. | Blocks submission and displays red validation errors. | [ ] | [ ] | |
| **FOLLOWUP-007** | Enter valid follow-up details and click Submit. | Entry is logged to database and appears in the follow-ups list. | [ ] | [ ] | |
| **FOLLOWUP-008** | Click status dropdown on a follow-up row. | Reveals options: Pending, Completed, Cancelled. | [ ] | [ ] | |
| **FOLLOWUP-009** | Select status. Inspect database and badges. | DB is updated instantly. Badge background updates dynamically (Pending=yellow, Completed=green, Cancelled=red). | [ ] | [ ] | |
| **FOLLOWUP-010** | Click "Edit" on follow-up row, modify fields, and save. | Opens modal pre-filled; saves modifications to the database successfully. | [ ] | [ ] | |
| **FOLLOWUP-011** | Click "Delete" on follow-up row and confirm. | Shows confirmation dialog; removes follow-up from DB. | [ ] | [ ] | |

---

## SECTION 11: ADMIN — AUDIT LOGS PAGE
*Section Subtotal: 10 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **AUDIT-001** | Navigate to `/admin/audit-logs`. | Audit Logs page loads successfully with all system activity logs. | [ ] | [ ] | |
| **AUDIT-002** | View the layout of filter control headers. | Dropdown filters are visible, responsive, and not collapsed. | [ ] | [ ] | |
| **AUDIT-003** | Click the Module filter dropdown. | Displays options: All, Users, Customers, Visits, Visitors, Follow-Ups. | [ ] | [ ] | |
| **AUDIT-004** | Click the Action filter dropdown. | Displays options: All, Create, Update, Delete, Login. | [ ] | [ ] | |
| **AUDIT-005** | Inspect the Date Range picker. | Displays clickable calendar inputs for Start Date and End Date. | [ ] | [ ] | |
| **AUDIT-006** | Choose filter criteria and click Filter. | Page queries database and updates table rows based on filters. | [ ] | [ ] | |
| **AUDIT-007** | Click "Clear Filters" or "Reset" button. | Clears selected inputs and resets table to show all audit logs. | [ ] | [ ] | |
| **AUDIT-008** | Inspect audit log columns. | Shows: User, Module, Action, Description, Timestamp. | [ ] | [ ] | |
| **AUDIT-009** | Examine log list date sequences. | Logs are listed in descending order (newest first). | [ ] | [ ] | |
| **AUDIT-010** | Inspect rows for actions (Edit/Delete). | Logs are strictly read-only. No modification actions are present. | [ ] | [ ] | |

---

## SECTION 12: ADMIN — SETTINGS PAGE
*Section Subtotal: 10 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **SETTINGS-001** | Navigate to `/admin/settings`. | Settings page loads correctly with password and preferences. | [ ] | [ ] | |
| **SETTINGS-002** | View the "Change Password" section. | Change Password form panel is visible. | [ ] | [ ] | |
| **SETTINGS-003** | Verify change password fields. | Displays: Current Password, New Password, Confirm Password. | [ ] | [ ] | |
| **SETTINGS-004** | Enter wrong current password and submit. | Blocks submission and shows invalid password error. | [ ] | [ ] | |
| **SETTINGS-005** | Enter a new password that violates strength rules and submit. | Blocks submission and shows strength error. | [ ] | [ ] | |
| **SETTINGS-006** | Type in new password field slowly. | Password strength indicator bar changes colors dynamically (Weak/Medium/Strong). | [ ] | [ ] | |
| **SETTINGS-007** | Enter correct current and valid strong new password, then save. | Saves new password securely and displays success toast. | [ ] | [ ] | |
| **SETTINGS-008** | View notification preferences panel. | Toggles for: Email (Follow-Up), Email (Visitor Check-In), In-App (Visit Updates) are visible. | [ ] | [ ] | |
| **SETTINGS-009** | Toggle notification switch values. | Toggles update instantly and save preferences state to the database. | [ ] | [ ] | |
| **SETTINGS-010** | Toggle a switch, refresh page, and observe status. | Saved switch preference state is successfully retrieved and rendered. | [ ] | [ ] | |

---

## SECTION 13: ADMIN — PROFILE PAGE
*Section Subtotal: 9 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **PROFILE-001** | Navigate to `/profile`. | Profile page loads successfully showing current logged-in user. | [ ] | [ ] | |
| **PROFILE-002** | Observe profile card details layout. | Displays: Name, Email (Read-only), Role (Read-only), Phone, Photo, Department, Status, Date. | [ ] | [ ] | |
| **PROFILE-003** | Modify the user Name input and click Save. | Updates user name in DB and updates header user label immediately. | [ ] | [ ] | |
| **PROFILE-004** | Modify Phone input and click Save. | Updates phone number in database successfully. | [ ] | [ ] | |
| **PROFILE-005** | Upload a new PNG/JPG profile photo. | Preview updates instantly on screen and image saves to database. | [ ] | [ ] | |
| **PROFILE-006** | Click the "Change Password" button in profile. | Opens password change modal with current and new fields. | [ ] | [ ] | |
| **PROFILE-007** | Enter valid passwords in modal and submit. | Password updates successfully and displays a success toast. | [ ] | [ ] | |
| **PROFILE-008** | Enter wrong current password inside modal and submit. | Blocks password change and displays incorrect current password error. | [ ] | [ ] | |
| **PROFILE-009** | Navigate away and return to `/profile`. | Updates remain saved and display correctly. | [ ] | [ ] | |

---

## SECTION 14: NOTIFICATION CENTER
*Section Subtotal: 29 Test Cases*

### UI and Bell Icon Testing
| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **NOTIFICATION-001** | Log in as Admin, Lead, Executive, or Customer. | Notification bell icon is visible in the upper header panel. | [ ] | [ ] | |
| **NOTIFICATION-002** | Check bell badge when unread notifications exist. | Shows a red circle badge containing the unread count. | [ ] | [ ] | |
| **NOTIFICATION-003** | Check badge count against database unread records. | Count matches the number of unread notifications in database. | [ ] | [ ] | |
| **NOTIFICATION-004** | Click the notification bell icon. | Notification dropdown overlay panel opens. | [ ] | [ ] | |
| **NOTIFICATION-005** | Click outside the opened notification dropdown panel. | Dropdown panel closes immediately. | [ ] | [ ] | |
| **NOTIFICATION-006** | Open the dropdown and inspect lists order. | Shows all user notifications sorted newest first (descending). | [ ] | [ ] | |
| **NOTIFICATION-007** | Verify notification list item fields. | Shows title, detail message, relative date/time (e.g., "2 hours ago"). | [ ] | [ ] | |
| **NOTIFICATION-008** | Look at top of notification dropdown. | "Mark all as read" button is clearly visible. | [ ] | [ ] | |
| **NOTIFICATION-009** | Click the "Mark all as read" button. | Clears the red badge count and marks all user notifications read. | [ ] | [ ] | |
| **NOTIFICATION-010** | Click on a specific notification card item. | Marks it read, closes dropdown, and navigates to target entity page. | [ ] | [ ] | |
| **NOTIFICATION-011** | Observe unread badge count after marking read. | Cleared or updated notification is no longer counted in badge. | [ ] | [ ] | |
| **NOTIFICATION-012** | Log in with no notifications or clear all items. | Dropdown shows "No new notifications" fallback message. | [ ] | [ ] | |

### Notification Triggers Testing
| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **NOTIFICATION-013** | Schedule a follow-up for a customer due today. | Notification is created in database and is visible in the bell. | [ ] | [ ] | |
| **NOTIFICATION-014** | Log a new marketing visit as a Marketing Executive. | Assigned marketing leaders receive an instant notification in the bell. | [ ] | [ ] | |
| **NOTIFICATION-015** | Check-in a walk-in visitor. | Admin and Marketing Lead accounts receive check-in notification alerts. | [ ] | [ ] | |
| **NOTIFICATION-016** | Check notification database model structure. | Entry has userId, title, message, type, isRead=false, createdAt. | [ ] | [ ] | |

### API and Database Level Testing
| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **NOTIFICATION-017** | Run `GET /api/notifications` API request. | Returns all logged notifications for the logged-in user. | [ ] | [ ] | |
| **NOTIFICATION-018** | Verify `/api/notifications` response sorting order. | JSON list is strictly ordered by createdAt descending (newest first). | [ ] | [ ] | |
| **NOTIFICATION-019** | Send `PATCH /api/notifications/read` request. | Sets `isRead: true` for all notifications belonging to the user. | [ ] | [ ] | |
| **NOTIFICATION-020** | Send `PATCH /api/notifications/:id/read` request. | Sets `isRead: true` only for notification matching the :id parameter. | [ ] | [ ] | |
| **NOTIFICATION-021** | Inspect database record fields after patch request. | Target database `isRead` field is updated to `true`. | [ ] | [ ] | |
| **NOTIFICATION-022** | Disable "In-app notifications for visit updates" in Settings. Log a visit. | Corresponding notification is not sent; preferences are respected. | [ ] | [ ] | |

### Notification Preferences Testing
| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **NOTIFICATION-023** | Navigate to Settings page. | Notification Preferences section is clearly visible. | [ ] | [ ] | |
| **NOTIFICATION-024** | Toggle "Email notifications for follow-up due date" switch on/off. | Switch toggles and updates database preference state. | [ ] | [ ] | |
| **NOTIFICATION-025** | Toggle "Email notifications for new visitor check-in" switch on/off. | Switch toggles and updates database preference state. | [ ] | [ ] | |
| **NOTIFICATION-026** | Toggle "In-app notifications for visit updates" switch on/off. | Switch toggles and updates database preference state. | [ ] | [ ] | |
| **NOTIFICATION-027** | Check `NotificationPreference` DB table fields. | Toggle states are successfully saved to `NotificationPreference` table in DB. | [ ] | [ ] | |
| **NOTIFICATION-028** | Refresh page after toggling settings switches. | Re-renders settings switches in the saved active/inactive state. | [ ] | [ ] | |
| **NOTIFICATION-029** | Disable email preference, and generate matching alert trigger. | In-app notification triggers, but email sending logic is bypassed. | [ ] | [ ] | |

---

## SECTION 15: MARKETING LEAD — SIDEBAR & PAGES
*Section Subtotal: 6 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **LEAD-001** | Log in as Marketing Lead. Observe the sidebar layout. | Displays only: Dashboard, My Team's Visits, Customers, Follow-Ups, Visitor Management, Profile, Notifications, Sign Out. | [ ] | [ ] | |
| **LEAD-002** | Inspect sidebar links for administrative pages. | Users, Audit Logs, and Settings links are fully omitted from sidebar. | [ ] | [ ] | |
| **LEAD-003** | Attempt direct URL access to `/admin/users` or `/admin/audit-logs`. | Intercepted and blocked with 403 Forbidden error or dashboard redirect. | [ ] | [ ] | |
| **LEAD-004** | View Lead Dashboard metrics cards. | KPI cards display counts filtered strictly to the Lead's team data. | [ ] | [ ] | |
| **LEAD-005** | Open Follow-Ups page. Assign a follow-up to an executive. | Lead can view and reassign team follow-ups to different executives. | [ ] | [ ] | |
| **LEAD-006** | Click the Sign Out button. | Logs out Lead successfully and redirects to `/login`. | [ ] | [ ] | |

---

## SECTION 16: MARKETING EXECUTIVE — SIDEBAR & PAGES
*Section Subtotal: 9 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **EXECUTIVE-001** | Log in as Marketing Executive. Inspect the sidebar options. | Displays only: Dashboard, My Visits, My Follow-Ups, Visitor Management, Profile, Notifications, Sign Out. | [ ] | [ ] | |
| **EXECUTIVE-002** | Verify sidebar and direct access to Admin and Lead pages. | Pages are hidden. Direct URL paths return 403 or redirect to login. | [ ] | [ ] | |
| **EXECUTIVE-003** | Open Visits page. Check logged rows. | Displays only marketing visits assigned to the logged-in executive. | [ ] | [ ] | |
| **EXECUTIVE-004** | Open Follow-Ups page. Check logged rows. | Displays only follow-ups assigned to the logged-in executive. | [ ] | [ ] | |
| **EXECUTIVE-005** | Click "+ Log Visit" button, enter details, and submit. | Executive can log a new visit; default assignee is themselves. | [ ] | [ ] | |
| **EXECUTIVE-006** | Click "Check Out" on an active visit assigned to self. | Executive can check out of their own visit, stamping outTime. | [ ] | [ ] | |
| **EXECUTIVE-007** | Attempt to edit a follow-up's assigned agent field. | Executive cannot change assignees or assign tasks to others. | [ ] | [ ] | |
| **EXECUTIVE-008** | Search using global search for another executive's visits. | Records from other executives are excluded from search results. | [ ] | [ ] | |
| **EXECUTIVE-009** | Click the Sign Out button. | Logs out executive successfully and redirects to `/login`. | [ ] | [ ] | |

---

## SECTION 17: CUSTOMER PORTAL — SIDEBAR & PAGES
*Section Subtotal: 8 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **CUSTOMER-001** | Log in as a Customer user. | Redirects automatically to the Customer Portal at `/customer/dashboard`. | [ ] | [ ] | |
| **CUSTOMER-002** | Observe the Customer Portal sidebar options. | Displays only: My Dashboard, My Profile, My Subscriptions, My Requests/Tickets, Sign Out. | [ ] | [ ] | |
| **CUSTOMER-003** | Inspect sidebar layout for internal CRM links. | All internal employee links (Visits, Visitors, Follow-Ups) are hidden. | [ ] | [ ] | |
| **CUSTOMER-004** | Manually type `/admin/dashboard` in the address bar. | Route guard intercepts and redirects back to `/customer/dashboard`. | [ ] | [ ] | |
| **CUSTOMER-005** | View `/customer/dashboard` contents. | Displays customer-specific subscription plan details and activity logs. | [ ] | [ ] | |
| **CUSTOMER-006** | Navigate to "My Profile", edit fields, and save. | Allows customer to update contact details and saves to DB. | [ ] | [ ] | |
| **CUSTOMER-007** | Navigate to "My Subscriptions". | Shows active plan details, billing logs, and invoice history. | [ ] | [ ] | |
| **CUSTOMER-008** | Click the Sign Out button. | Logs out customer successfully and redirects to `/login`. | [ ] | [ ] | |

---

## SECTION 18: SIGN OUT (ALL ROLES)
*Section Subtotal: 6 Test Cases*

| Test ID | Test Step / Action | Expected Result | Pass [ ] | Fail [ ] | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **SIGNOUT-001** | Log in as Admin, Lead, Executive, and Customer. | Sign Out button is visible at the bottom of the sidebar for all roles. | [ ] | [ ] | |
| **SIGNOUT-002** | Click the Sign Out button while inspecting cookies. | Clears browser session cookies/JWT tokens instantly. | [ ] | [ ] | |
| **SIGNOUT-003** | Confirm redirect target on clicking Sign Out. | Application redirects immediately to `/login`. | [ ] | [ ] | |
| **SIGNOUT-004** | Click the browser back arrow after signing out. | User remains on `/login` screen (preventing dashboard return). | [ ] | [ ] | |
| **SIGNOUT-005** | Attempt direct access to `/admin/dashboard` after sign out. | Session check blocks access and forces redirect to `/login`. | [ ] | [ ] | |
| **SIGNOUT-006** | Validate sign out on Admin, Lead, Executive, and Customer. | Destroys sessions and redirects to `/login` for all roles correctly. | [ ] | [ ] | |

---

## TEST SUITE SUMMARY

| Section | Feature Area / Module | Total Test Cases | Pass | Fail | Notes |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | Login Page | 18 | [ ] | [ ] | |
| **2** | Forgot Password Flow | 15 | [ ] | [ ] | |
| **3** | Account Activation Flow (New Users) | 8 | [ ] | [ ] | |
| **4** | Admin — Sidebar Navigation | 16 | [ ] | [ ] | |
| **5** | Admin — Dashboard | 13 | [ ] | [ ] | |
| **6** | Admin — Users Page | 18 | [ ] | [ ] | |
| **7** | Admin — Customers Page | 12 | [ ] | [ ] | |
| **8** | Admin — Marketing Visits Page | 10 | [ ] | [ ] | |
| **9** | Admin — Visitor Management Page | 12 | [ ] | [ ] | |
| **10** | Admin — Follow-Ups Page | 11 | [ ] | [ ] | |
| **11** | Admin — Audit Logs Page | 10 | [ ] | [ ] | |
| **12** | Admin — Settings Page | 10 | [ ] | [ ] | |
| **13** | Admin — Profile Page | 9 | [ ] | [ ] | |
| **14** | Notification Center | 29 | [ ] | [ ] | |
| **15** | Marketing Lead — Sidebar & Pages | 6 | [ ] | [ ] | |
| **16** | Marketing Executive — Sidebar & Pages | 9 | [ ] | [ ] | |
| **17** | Customer Portal — Sidebar & Pages | 8 | [ ] | [ ] | |
| **18** | Sign Out (All Roles) | 6 | [ ] | [ ] | |
| **Total** | **All Sections** | **220** | **[ ]** | **[ ]** | **Grand Total Checklist** |

---

## FOOTER & GENERAL TESTING SPECIFICATION

"All features must be tested in both desktop (1280px+) and mobile (375px) screen sizes."

---
*End of Document. Master checklist version 1.0 (May 28, 2026).*
