# BUGS.md — Safe Travel Rwanda

## What belongs here

- Confirmed bugs in implemented code.
- Known gaps between what is scaffolded and what is actually working.
- Issues discovered during testing or code review that need to be fixed.
- Do NOT log feature requests or future enhancements here — those go in `TASKS.md`.
- When a bug is fixed, move it to the RESOLVED section with the fix summary and date.

---

## Open Issues

### BUG-009 — Forgot-password never sent email (console-only stub)

**Severity:** High
**Area:** Backend — auth.service.js / mail
**Description:** `forgotPassword` generated a reset token and logged it to the console in development only. No email was ever sent. No `nodemailer` or SMTP utility existed.
**Fix:** Created `backend/src/utils/mail.utils.js` with a Nodemailer Gmail SMTP transporter. Updated `auth.service.js` to call `sendPasswordResetEmail`. Added `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FRONTEND_URL` env vars to `env.js`, `.env`, and `.env.example`. Updated DECISIONS.md (decision #35). Nodemailer added as a dependency.
**Status:** Resolved — 2026-04-18

---

### BUG-001 — Business logic still stubbed in admin modules

**Severity:** High  
**Area:** Backend — admin CRUD and dashboard modules  
**Description:** Auth, booking, payment, and boarding flows are now implemented. Several admin-facing CRUD and dashboard modules still contain stub responses or placeholder controllers.  
**Status:** Open — next focus is admin CRUD coverage.  
**Discovered:** Project scaffold review

---

### BUG-004 — Migration not yet run (MySQL not running at implementation time)

**Severity:** High  
**Area:** Database  
**Description:** The Prisma schema has been updated (passwordHash nullable, phone unique, googleId, passwordResetToken fields added) but the migration has not been applied because MySQL was not running. The database schema is out of sync with the Prisma schema.  
**Status:** Open — run `npx prisma migrate dev --name init` from the backend directory once MySQL is started.  
**Discovered:** 2026-04-15

---

---

### BUG-007 — Boarding scope enforcement used stale JWT role

**Severity:** Low  
**Area:** Backend — boarding.service.js  
**Description:** `enforceBoardingScope` checked `actor.role` (JWT payload) instead of `actorUser.role` (fresh DB value). If a user's role was changed in the DB after token issuance, the company-scope check could be applied to a now-ADMIN user or bypassed for a now-OPERATOR user.  
**Fix:** Changed check to `actorUser.role !== 'OPERATOR'`. Single-line fix in `boarding.service.js`.  
**Status:** Resolved — 2026-04-17

---

### BUG-008 — Phone/email boarding search added in error (removed)

**Severity:** Medium  
**Area:** Backend — boarding.service.js, boarding.validator.js; Frontend — BoardingValidation.jsx, translations.js  
**Description:** A previous batch added phone and email as valid inputs for `GET /api/boarding/lookup`. This was not part of the agreed product flow (token/reference-only boarding). It also leaked passenger contact details through a search endpoint that should only accept a known reference.  
**Fix:** Removed `searchBoardingBookings`, reverted `lookupBoardingSchema` to enforce `RW-XXXXXXXX` format, updated UI translations in all 3 languages to reference-only text.  
**Status:** Resolved — 2026-04-17

---

## Resolved Issues

### BUG-018 — Seed data was too sparse and internally inconsistent for booking demos

**Fix:** Reworked `backend/prisma/seed.js` into a deterministic demo-data seed. It now clears only operational trip/booking data, ensures 3 active companies with assigned operators, seeds realistic fleet and driver records per company, guarantees schedules for every active route across today plus the next 5 days, and keeps demo bookings consistent with business rules by using future `SCHEDULED` trips for active bookings, decrementing `seatsAvailable` for confirmed/completed bookings, and moving the completed booking fixture onto a historical completed schedule.
**Resolved:** 2026-04-19

---

### BUG-017 — Auth panel live-data presentation felt internal and repetitive

**Fix:** Refined the auth left panel in `AuthLayout.jsx` to keep the real `/api/settings/auth-panel` data source while presenting it as a product-facing overview instead of a raw metric dump. Replaced the repeated metric sentence/list with a single stat-card row for active routes, today’s departures, and active bus companies, plus a separate support block only when support contact data exists. Loading and fallback states were kept intact and restyled to match the panel.
**Resolved:** 2026-04-19

---

### BUG-016 — Auth layout left panel showed fake hardcoded marketing stats

**Fix:** Replaced the static auth-panel route/departure/payment claims with a public read-only `/api/settings/auth-panel` endpoint backed by real database counts and public platform settings. The left panel in `AuthLayout.jsx` now fetches active route count, today’s departures, active bus company count, and support contact data when present. Unsupported claims are no longer shown, and loading/fallback states no longer expose misleading numbers.
**Resolved:** 2026-04-19

---

### BUG-015 — Dashboard layouts broke on mobile and cramped tablet widths

**Fix:** Updated `AdminLayout`, `PassengerLayout`, `OperatorLayout`, `SuperAdminLayout`, and the shared `Sidebar` so the dashboard nav is hidden by default on phones, opens as a drawer overlay, closes on outside click and navigation, and leaves desktop behavior intact from `md` upward. Added responsive breakpoint fixes for KPI grids, shared dashboard tables, CRUD action cells, and the most affected dashboard-owned pages so mobile/tablet widths no longer inherit the old fixed-sidebar assumptions.
**Resolved:** 2026-04-19

---

### BUG-014 — Routes module and ManageRoutes page were still placeholders

**Fix:** Replaced the stubbed `/api/routes` module with validated route-management handlers for list/search/filter, create, update, and status toggle, while keeping the public active route listing intact on the same endpoint. Replaced the placeholder `ManageRoutes.jsx` page with a real localized admin CRUD UI for route records, including filters, create/edit modal flows, and activate/deactivate actions.
**Resolved:** 2026-04-18

---

### BUG-013 — Drivers module and ManageDrivers page were still placeholders

**Fix:** Replaced the stubbed `/api/drivers` module with validated `ADMIN`/`SUPER_ADMIN` endpoints for list/search/filter, create, update, status toggle, and company lookup. Replaced the placeholder `ManageDrivers.jsx` page with a real localized CRUD UI for driver records, including filters, create/edit modal flows, and activate/deactivate actions.
**Resolved:** 2026-04-18

---

### BUG-012 — Buses module and ManageBuses page were still placeholders

**Fix:** Replaced the stubbed `/api/buses` module with validated `ADMIN`/`SUPER_ADMIN` endpoints for list/search/filter, create, update, status toggle, and company lookup. Replaced the placeholder `ManageBuses.jsx` page with a real localized CRUD UI for fleet records, including filters, create/edit modal flows, and activate/deactivate actions.
**Resolved:** 2026-04-18

---

### BUG-011 — Operators module and ManageOperators page were still placeholders

**Fix:** Replaced the stubbed `/api/operators` module with validated SUPER_ADMIN-only endpoints for list/search/filter, create, status toggle, and company reassignment. Replaced the placeholder `ManageOperators.jsx` page with a real localized management UI using the existing `User(role=OPERATOR)` model.
**Resolved:** 2026-04-18

---

### BUG-010 — Admin and super-admin profile links bypassed dashboard layouts

**Fix:** Updated shared navbar and sidebar profile links so `admin` goes to `/admin/profile` and `super_admin` goes to `/super-admin/profile`. Added nested profile routes under `AdminLayout` and `SuperAdminLayout`, and changed the generic `/profile` route into a role-aware redirect so stale links still land in the correct layout-owned page.
**Resolved:** 2026-04-18

---

### BUG-005 — Booking after departure not blocked

**Fix:** Added `now >= departureTime` check in `bookings.service.js` after schedule is loaded. Throws `DEPARTED` error code; controller returns 400. `BookingPage.jsx` computes `hasDeparted` flag, disables the confirm button, and shows an amber warning before the user even attempts the request.  
**Resolved:** 2026-04-16

---

### BUG-006 — Account deletion: post-deletion navigation blocked if logout fails

**Fix:** Separated the `deleteAccount()` call from the `logout()` call in `ProfilePage.jsx`. If `logout()` throws after a successful account deletion, the error is silently caught and the user is still redirected to `/`. The account was already deleted and `authService.logout`'s `finally` block already cleared localStorage.  
**Resolved:** 2026-04-16

---

### BUG-002 — Prisma schema not validated against business requirements

**Fix:** Schema reviewed and refined: passwordHash made nullable (Google auth), phone made unique (login by phone), googleId field added, passwordResetToken + passwordResetExpiresAt fields added. All enums, relations, statuses confirmed correct.  
**Resolved:** 2026-04-15

---

### BUG-003 — Auth flow not verified end-to-end

**Fix:** Full auth implementation completed: register (with Rwanda phone validation), login by email or phone, refresh token rotation, logout, forgot/reset password, Google auth, /api/me. Frontend connected with AuthContext, role normalization, and Google sign-in buttons.  
**Status:** Implemented. Manual testing still needed once MySQL migration is applied.  
**Resolved (pending migration):** 2026-04-15
