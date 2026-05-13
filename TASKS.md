# TASKS.md — Safe Travel Rwanda

## How to use this file

- Update this file after every meaningful implementation batch.
- Move items from TODO to COMPLETED when done; never delete them.
- Keep task descriptions short and specific — this is a status tracker, not a spec.
- If a task uncovers a new sub-task, add it inline under the parent.
- Current phase label must be updated when the phase changes.

---

## Current Phase: Phase 4 — Booking, Simulated Payment & Confirmation (implemented; migration + manual testing pending)

Recent note: Completed fresh user-facing rebrand from Rugendo Rwanda to Safe Travel Rwanda across visible text, translations, metadata, and relevant backend/email/demo text. Logo and hero image were already changed, so image assets were not modified. Internal technical identifiers were left unchanged where renaming could break functionality.

---

## TODO

### In-App Notifications — Batch 4: Improvements ✅ COMPLETE

- [x] Notify COMPANY_ADMIN and OPERATOR when a passenger booking is created (`bookings.service.js` → `notifyCompanySideOnBooking`) — title "New Pending Booking", uses projected remaining seats (seats not yet decremented)
- [x] Notify COMPANY_ADMIN and OPERATOR when payment succeeds and booking is confirmed (`payments.service.js` → `notifyCompanySideOnConfirmed`) — title "Booking Confirmed", uses actual remaining seats post-decrement
- [x] Fix notification polling — now polls full list every 60s (not just unread count) so new notifications appear without reload
- [x] Fix `archiveNotification` stale closure bug in context — count now reads from functional updater
- [x] Add server-side count sync after `markAsRead`, `markAllRead`, `archiveNotification`
- [x] Add `NotificationBell` to public `Navbar.jsx` for logged-in users (desktop + mobile)
- [x] Fix `viewAllPath` in `NotificationBell` — uses user role on public pages so "View all" goes to correct role notifications page

### In-App Notifications — Batch 2: Triggers ✅ COMPLETE

- [x] Add `createNotification()` trigger to `bookings.service.js` → `createBooking()`
- [x] Add `createNotification()` triggers to `payments.service.js` → `payBooking()` (success + failure paths)
- [x] Add `createNotification()` trigger to `bookings.service.js` → `cancelBooking()`
- [x] Add `createNotification()` trigger to `boarding.service.js` → `validateBoarding()`
- [x] Add `createNotification()` trigger to `auth.service.js` → `resetPassword()`
- [x] Add `createNotification()` trigger to `users.service.js` → `updateUser()`
- [x] Add `createNotification()` trigger to `companies.service.js` → `updateCompanyStatus()`
- [x] Add `createNotification()` trigger to `settings.service.js` → `upsertSetting()`
- [~] Schedule triggers skipped — `cancelSchedule()` and `updateSchedule()` both block when active bookings exist (409 guard), making passenger fan-out unreachable under current business rules

### In-App Notifications — Batch 3: Frontend ✅ COMPLETE

- [x] Create `frontend/src/services/notificationService.js`
- [x] Create `frontend/src/contexts/NotificationContext.jsx` (60s poll for unread count)
- [x] Wrap `NotificationContext` in `main.jsx` provider tree (inside AuthProvider)
- [x] Create `frontend/src/components/common/NotificationBell.jsx`
- [x] Add `NotificationBell` to all 5 dashboard layouts
- [x] Create `frontend/src/pages/notifications/NotificationsPage.jsx`
- [x] Add notification routes to `router.jsx` for all 5 roles
- [x] Add notification translation keys (all 4 languages) to `translations.js`

### Brand Refresh — Frontend Visual Identity

- [ ] Continue Safe Travel Rwanda brand refresh using `BRAND_REFRESH_PLAN.md` (saved plan, not yet implemented)
  - Read `BRAND_REFRESH_PLAN.md` first
  - Start in Plan mode, confirm intended files, then implement
  - Trigger phrase: "continue the Safe Travel Rwanda brand refresh" or "let us continue son"

---

### Company Admin - Manual Testing Required

- [x] Add `COMPANY_ADMIN` role to Prisma role enum and frontend role normalization
- [x] Add company-scoped `/api/company-admin/*` backend module
- [x] Add company admin dashboard layout and MVP pages
- [x] Add company admin translation keys in English, Kinyarwanda, French, and Kiswahili
- [x] Seed one company admin user per seeded company
- [x] Run Prisma migration for `COMPANY_ADMIN` role once MySQL is available
- [x] Seed database and verify company admin demo credentials
- [ ] Re-run `npx prisma generate` after releasing the local Windows Prisma DLL file lock
- [ ] Login as `companyadmin.gicumbi@test.rw` and confirm redirect to `/company-admin`
- [ ] Verify company admin sees only its company's bookings, schedules, buses, drivers, operators, and revenue
- [ ] Verify company admin cannot access platform admin/super-admin pages
- [ ] Verify operator remains boarding/check-in only
- [ ] Verify public signup still creates `PASSENGER` only

### Dashboard / UX Polish — Manual Review Required

- [x] Sidebar logout: added logout SVG icon, styled consistently with nav links (icon + label, red tone)
- [x] Bookings (last 14 days) chart: root-cause traced — logic was correct; improved empty-state messages to distinguish "no activity in last 14 days" vs "chart error" vs generic empty state; added translation keys (`adminChartNoRecentData`, `adminChartError`) in all 4 languages
- [x] /super-admin/users: removed inline email/phone/company from user list rows; added eye icon button + UserDetailModal with full user details (name, role, status, email, phone, company, join date)
- [x] /super-admin/settings: widened from `max-w-2xl` to `max-w-4xl` for better page width utilization
- [x] Profile pages: widened from `max-w-2xl` to `max-w-4xl` for better page width utilization
- [x] `/admin/schedules` and `/admin/bookings`: simplified table columns, added eye-icon detail modals, moved schedule edit/cancel into a three-dots menu, and upgraded pagination to numbered controls
- [ ] Review sidebar icons across all role dashboards — verify alignment, active state, hover state
- [ ] Verify language selector + theme toggle in topbar work correctly on desktop and mobile
- [ ] Verify companies table is clean (no inline amber resource text), eye icon visible in Actions
- [ ] Click eye icon on a company row — confirm polished view modal opens with counts + warning alert
- [ ] Verify `/admin` dashboard: "Top Routes" section is gone; "Recent Bookings" spans full width
- [ ] Verify "Bookings over time" and "Revenue over time" charts render on `/admin` and `/super-admin`
- [x] Add `manageCompaniesViewDetails` translation key to `translations.js` (all 4 languages) — fallback removed from component

### Database Setup

- [ ] Start MySQL server and run `npx prisma migrate dev --name init` (blocked: MySQL not running)
- [ ] Verify all tables created correctly in MySQL
- [ ] Run seed: `node prisma/seed.js` to populate the deterministic demo dataset for booking/search testing (blocked: MySQL not running)

### Auth — Manual Testing Required

- [ ] Test `POST /api/auth/register` with email + Rwanda phone
- [ ] Test `POST /api/auth/login` with email identifier
- [ ] Test `POST /api/auth/login` with Rwanda phone identifier
- [ ] Test `POST /api/auth/refresh` with valid refresh token
- [ ] Test `POST /api/auth/logout`
- [ ] Test `GET /api/me` with valid access token
- [ ] Test `POST /api/auth/forgot-password` (check console for reset link in dev)
- [ ] Test `POST /api/auth/reset-password` with valid token
- [ ] Test `POST /api/auth/google` with a real Google credential
- [x] Implement role-based redirect after login (passenger → `/`, others → their dashboard)
- [x] Avatar/user dropdown in navbar (Profile, Dashboard, Logout) for all logged-in roles
- [x] Dashboard dark-mode default (applies if no theme preference stored)
- [x] Sidebar: Profile + Homepage links for all roles
- [x] Generic `/profile` route redirects authenticated users to their role-owned profile route
- [x] Role-owned profile routes for dashboard roles (`/admin/profile`, `/super-admin/profile`, `/operator/profile`)
- [ ] Verify role-based redirect to correct dashboard after login
- [ ] Verify ProtectedRoute blocks unauthenticated access
- [ ] Verify ProtectedRoute blocks wrong-role access
- [ ] Verify Google button renders on login and register pages

### Theme and Language Verification

- [ ] Verify dark / light mode toggle works and persists preference
- [x] Global multilingual system implemented (en, fr, rw, sw) — see DECISIONS.md #N
- [x] Language persists in localStorage under key `rugendo-lang`
- [x] Language switcher in Navbar (desktop + mobile) updates full app immediately
- [x] Navbar, Sidebar, Footer fully translated (4 languages)
- [x] Auth flow fully translated: Login, Register, ForgotPassword, ResetPassword
- [x] Passenger booking flow translated: BookingPage, PaymentPage, BookingConfirmationPage, MyBookingsPage
- [x] Operator flow: BoardingValidation + OperatorBookings already translated; sw locale added
- [x] Dashboard stubs translated: PassengerDashboard, OperatorDashboard
- [ ] Manual test: switch to each language, verify all 4 change immediately app-wide
- [ ] Remaining untranslated: public pages (HomePage, SearchTripsPage, SearchResultsPage, RoutesPage, HowItWorksPage, FAQ, About, Contact, Legal pages), admin/super-admin pages, OperatorProfile, passenger ProfilePage

### Responsive QA

- [ ] Manual responsive QA: verify dashboard layouts + representative dashboard pages at `320px`–`430px`, `768px`–`1024px`, and desktop
- [ ] Later responsive pass: remaining public/auth/detail pages outside the dashboard-focused layout batch

### Boarding — Manual Testing Required

- [x] Boarding lookup: reference-only (`?query=RW-XXXXXXXX`); phone/email search removed
- [x] Boarding lookup returns array of 0 or 1 booking (company-scoped for operators)
- [x] Operator UI: single reference search field, detail + validate view
- [x] Operator company bookings: `GET /api/bookings/operator-company` — company-scoped booking list with seat availability
- [x] Operator bookings page: `/operator/bookings` — shows passenger, reference, route, departure, seats booked, seats remaining, status, payment
- [x] Seed data updated: 7 diverse bookings across both companies covering all states
- [ ] Test `GET /api/boarding/lookup?query=RW-A11CE001` (Volcano op — found, boardable)
- [ ] Test `GET /api/boarding/lookup?query=RW-B0B00002` (Volcano op — 403)
- [ ] Test `GET /api/boarding/lookup?query=RW-B0B00002` (Horizon op — found)
- [ ] Test `POST /api/boarding/validate` success path on RW-A11CE001 (CONFIRMED+PAID)
- [ ] Test boarding validation rejects RW-A11CE002 (PENDING), RW-B0B00001 (CANCELLED), RW-CA01CA01 (COMPLETED)
- [ ] Test `GET /api/bookings/operator-company` as operator@test.rw → Volcano bookings
- [ ] Test `GET /api/bookings/operator-company` as operator2@test.rw → Horizon bookings only
- [ ] Verify operator company banner shows company name on bookings page
- [ ] Verify seats-remaining column colours correctly (0=red, ≤5=amber, else green)

### Super-admin — Manual Testing Required

- [ ] Test `GET /api/operators` list, search, company filter, and status filter
- [ ] Test `POST /api/operators` creates an `OPERATOR` user with company assignment
- [ ] Test `PATCH /api/operators/:id/status` deactivate/reactivate flow
- [ ] Test `PATCH /api/operators/:id/company` reassigns operator company correctly
- [ ] Verify `/super-admin/operators` create modal, table states, and row actions in all expected paths

### Admin — Manual Testing Required

- [ ] Test `GET /api/buses` list, search, company filter, and status filter
- [ ] Test `POST /api/buses` creates a bus with plate number, capacity, company, and status
- [ ] Test `PATCH /api/buses/:id` updates plate number, model, capacity, and status
- [ ] Test `PATCH /api/buses/:id` rejects company reassignment once schedules exist
- [ ] Test `PATCH /api/buses/:id` rejects lowering capacity below scheduled seats
- [ ] Test `PATCH /api/buses/:id/status` deactivate/reactivate flow
- [ ] Verify `/admin/buses` filters, loading/error/empty states, create/edit modal, and row actions in expected paths
- [ ] Test `GET /api/drivers` list, search, company filter, and status filter
- [ ] Test `POST /api/drivers` creates a driver with name, license number, phone, and company
- [ ] Test `PATCH /api/drivers/:id` updates name, phone, license number, and company
- [ ] Test `PATCH /api/drivers/:id` rejects company reassignment once schedules exist
- [ ] Test `PATCH /api/drivers/:id/status` deactivate/reactivate flow
- [ ] Verify `/admin/drivers` filters, loading/error/empty states, create/edit modal, and row actions in expected paths
- [ ] Test `GET /api/routes?scope=admin` list, search, and status filter
- [ ] Test `POST /api/routes` creates a route with origin, destination, optional distance, optional duration, and status
- [ ] Test `PATCH /api/routes/:id` updates route details and availability
- [ ] Test `PATCH /api/routes/:id` rejects same-origin/destination routes and duplicate origin+destination pairs
- [ ] Test `PATCH /api/routes/:id` rejects origin/destination changes once schedules exist
- [ ] Test `PATCH /api/routes/:id/status` deactivate/reactivate flow
- [ ] Verify `/admin/routes` filters, loading/error/empty states, create/edit modal, and row actions in expected paths

### Near-Next (After Auth is Solid)

- [x] Route search — `GET /api/schedules/search?from=&to=&date=&seats=`
- [x] Public routes listing — `GET /api/routes`
- [x] Schedule listing for a route and date (real API, loading/error/empty states)
- [x] Seat count selection on booking summary page
- [x] Schedule selection handoff — `BookingPage` loads schedule by ID, shows summary, passes state toward payment
- [x] Seed data — companies, buses, drivers, routes, schedules for testing search
- [x] Booking creation — `POST /api/bookings`
- [x] Simulated payment flow — `POST /api/payments/pay`
- [x] Booking token / reference generation (unique, human-readable) — format: RW-XXXXXXXX
- [x] Booking confirmation page — `/passenger/booking-confirm`
- [x] My Bookings page (upcoming trips + past grouping) — `/passenger/bookings`
- [ ] Past Trips page (basic grouping in MyBookings; dedicated page is future)
- [x] Cancel booking — `PATCH /api/bookings/:id/cancel` (PENDING-only; service + controller + route implemented)
- [x] Retry payment after FAILED — backend upserts existing payment record; duplicate-payment guard tightened
- [x] My Bookings: Retry Payment + Cancel Booking actions for PENDING bookings
- [x] Signup: email OR phone required (not both) — backend validator + frontend form + auth service
- [x] Prisma schema: email made nullable (String?) so phone-only registration stores null email correctly
- [x] Duplicate booking guard: backend blocks second PENDING/CONFIRMED booking for same user + scheduleId (409)
- [x] Departure time guard: backend blocks booking at or after departureTime (400); frontend disables button and shows warning
- [x] Profile page: view info, update name/email/phone, permanently delete account with confirmation
- [x] Account deletion: DELETE /api/users/me route correctly wired; post-deletion navigate is decoupled from logout call
- [x] Password show/hide toggle on Login, Register, Reset Password forms
- [ ] Booking details page
- [ ] Admin: user management CRUD
- [x] Admin: route management CRUD (`GET public/admin scope`, `POST`, `PATCH`, `PATCH status` + ManageRoutes UI)
- [x] Admin: schedule management CRUD (backend service/controller/validator/routes + ManageSchedules UI + translations all 4 languages)
- [x] Admin: bus management CRUD (`GET/POST/PATCH/PATCH status` + ManageBuses UI)
- [x] Admin: driver management CRUD (`GET/companies/POST/PATCH/PATCH status` + ManageDrivers UI)
- [ ] Test `GET /api/schedules` (admin token) — paginated list with routeId + status filters
- [ ] Test `POST /api/schedules` with valid payload → 201
- [ ] Test `POST /api/schedules` with invalid routeId → 404
- [ ] Test `POST /api/schedules` duplicate route+bus+departureTime → 409
- [ ] Test `POST /api/schedules` price ≤ 0 → 422
- [ ] Test `PATCH /api/schedules/:id` updates freely when no bookings exist
- [ ] Test `PATCH /api/schedules/:id` blocks price/seats/time change when PENDING/CONFIRMED bookings exist → 409
- [ ] Test `DELETE /api/schedules/:id` with no active bookings → 200 status=CANCELLED
- [ ] Test `DELETE /api/schedules/:id` with PENDING bookings → 409
- [ ] Test schedule endpoints without auth → 401
- [ ] Test schedule endpoints with PASSENGER token → 403
- [ ] Verify `/admin/schedules` list, filters, create modal, edit modal, cancel confirm modal in browser
- [x] Admin: booking management view (read-only list + detail modal; filters: status, paymentStatus, date; pagination)
- [ ] Admin: payment record view
- [x] Operator: boarding validation flow (backend + frontend; scope enforcement bug fixed; seed booking added)
- [x] Super-admin: operator management (`GET/POST/PATCH status/PATCH company` + ManageOperators UI)
- [x] Super-admin: company management (`GET/POST/PATCH/PATCH status` + ManageCompanies UI; deactivation blocked while active schedules exist)
- [ ] Super-admin: platform settings page

---

## COMPLETED

### In-App Notifications — Batch 1: Backend Foundation (2026-05-02)

- [x] Add `NotificationType`, `NotificationPriority`, `NotificationStatus` enums to Prisma schema
- [x] Add `Notification` model to Prisma schema with userId FK (cascade delete), indexes on `(userId, status)` and `(userId, createdAt)`
- [x] Add `notifications Notification[]` relation to `User` model
- [x] Create `backend/src/modules/notifications/notifications.service.js` — `createNotification`, `getMyNotifications`, `getUnreadCount`, `markAsRead`, `markAllRead`, `archiveNotification`
- [x] Create `backend/src/modules/notifications/notifications.validator.js` — list query params + id param validators
- [x] Create `backend/src/modules/notifications/notifications.controller.js` — 5 handlers using existing apiResponse helpers
- [x] Create `backend/src/modules/notifications/notifications.routes.js` — all routes auth-protected, no role restriction
- [x] Register `/api/notifications` in `backend/src/app.js`
- [x] Log decisions #32, #33, #34 in DECISIONS.md
- [ ] Run `npx prisma migrate dev --name add_notifications` (pending — user must run locally)
- [ ] Manual API test all 5 endpoints (pending migration)

### Demo Data

- [x] Seed script expanded to deterministic booking demo data: 3 active companies, company-assigned fleet/drivers/operators, all active routes covered, and schedules generated for today plus the next 5 days
- [x] Seed booking fixtures corrected to respect booking/search rules: only future `SCHEDULED` trips are used for active bookings, confirmed/completed bookings decrement `seatsAvailable`, and completed booking demo data now uses a historical completed schedule

### Frontend Responsive Fixes

- [x] Dashboard layouts: mobile drawer sidebar for passenger/admin/super-admin/operator, with overlay close, route-change close, and full-width mobile content
- [x] Responsive breakpoint pass for dashboard KPI grids, shared dashboard tables, CRUD action cells, and key dashboard-owned pages (operator boarding/bookings, passenger bookings, admin/super-admin management screens)
- [x] Auth layout left panel now uses live database-backed route/schedule/company/support data instead of fake hardcoded marketing stats
- [x] Auth layout left panel presentation refined: product-facing copy, stat-card layout, and optional support block using the same live auth-panel data

### Phase 1 — Scaffolding

- [x] Initialize project repository
- [x] Set up frontend with Vite + React + Tailwind CSS
- [x] Set up backend with Express.js + ES modules
- [x] Set up modular backend folder structure (routes, controllers, middleware, prisma)
- [x] Initialize Prisma with MySQL provider
- [x] Scaffold auth routes and controllers (stubbed)
- [x] Scaffold role-based frontend layouts (passenger, admin, super-admin, operator)
- [x] Scaffold frontend pages for all major sections (placeholder content)

### Phase 2 — Schema + Auth Implementation

- [x] Review and verify Prisma schema against all business requirements
- [x] Add googleId, passwordResetToken, passwordResetExpiresAt fields; make passwordHash nullable; add phone @unique
- [x] Implement `POST /api/auth/register` — name, email, Rwanda phone, password; duplicate checks
- [x] Implement `POST /api/auth/login` — supports email OR Rwanda phone as identifier
- [x] Implement `POST /api/auth/refresh` — rotate refresh token
- [x] Implement `POST /api/auth/logout` — delete refresh token from DB
- [x] Implement `GET /api/me` and `GET /api/auth/me`
- [x] Implement `POST /api/auth/forgot-password` — generate reset token (logs to console in dev)
- [x] Implement `POST /api/auth/reset-password` — validate token, update password, clear token
- [x] Implement `POST /api/auth/google` — verify Google ID token, find/create/link user
- [x] Rwanda phone validation regex on both backend (Zod) and frontend
- [x] Role normalization in AuthContext: DB enum (SUPER_ADMIN) → frontend (super_admin)
- [x] Fix refresh token flow in api.js — send token in body, not empty body
- [x] Update LoginPage — identifier field (email or phone), Google sign-in button
- [x] Update RegisterPage — required phone with Rwanda validation hint, Google sign-up button
- [x] Fix role strings in router.jsx — super-admin → super_admin (consistent with normalization)
- [x] Add `requireRole` middleware (already existed; wired into auth routes)
- [x] Seed script: `prisma/seed.js` with one user per role
- [x] Frontend `.env` with VITE_GOOGLE_CLIENT_ID
