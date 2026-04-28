# DECISIONS.md — Rugendo Rwanda

A numbered log of architectural and product decisions made during this project.
Add a new entry whenever a meaningful decision is made. Never delete entries — mark superseded ones as `[SUPERSEDED by #N]`.

Format: `## N. Title` → `**Decision:**` → `**Why:**` → `**Date:**`

---

## 1. Stack: React + Vite + Tailwind (Frontend)

**Decision:** Frontend uses React.js, Vite as build tool, and Tailwind CSS for styling. JavaScript/JSX only — no TypeScript.

**Why:** Fastest setup for a booking platform MVP. Tailwind keeps styling consistent without fighting CSS specificity. TypeScript is deferred to avoid slowing down the initial build phase; it can be added later if the team grows.

**Date:** Project start

---

## 2. Stack: Node.js + Express + Prisma + MySQL (Backend)

**Decision:** Backend is Node.js with Express.js, using Prisma ORM over a MySQL database. ES modules only — no CommonJS.

**Why:** Standard, well-documented stack suitable for REST APIs. Prisma gives a typed query builder with migration support. MySQL is widely available and fits a relational booking data model well. ES modules enforced from the start to avoid mixed-module pain later.

**Date:** Project start

---

## 3. No Redis in MVP

**Decision:** Redis (or any in-memory store) is not used in the MVP. Refresh token invalidation handled in the MySQL database.

**Why:** Adding Redis increases operational complexity and requires an additional service. For MVP scale, storing refresh tokens in MySQL is sufficient. Redis can be introduced later for caching and token blocklists if needed.

**Date:** Project start

---

## 4. Role Model: Five Roles [SUPERSEDED by #55]

**Decision:** The platform has exactly five roles: `guest`, `passenger`, `admin`, `super_admin`, `operator`. There is no separate "boarding agent" role.

**Why:** Keeping roles minimal reduces complexity. Operators already handle boarding validation — a dedicated boarding-agent role would duplicate scope with no benefit at this stage.

**Date:** Project start

---

## 5. Super-admin Scope

**Decision:** `super_admin` has all `admin` permissions plus exclusive access to platform-wide settings and appearance controls.

**Why:** Super-admin needs to be a strict superset of admin so that platform-level configuration is never blocked by permission gaps. Operators and admins should not access platform settings.

**Date:** Project start

---

## 6. MVP Must Include Operational Workflows, Not Only Passenger UI

**Decision:** The MVP is not a passenger-only web app. Admin, super-admin, and operator dashboards are in scope for MVP.

**Why:** Without operational tooling, the platform cannot be used in production — routes, schedules, buses, and drivers cannot be managed, and boarding cannot be validated. A passenger-only frontend with no backend operations is not a launchable product.

**Date:** Project start

---

## 7. Dark / Light Mode Is Part of MVP

**Decision:** Dark and light mode toggle is included in the MVP passenger and admin interfaces.

**Why:** It was explicitly agreed as an MVP requirement, not a nice-to-have. Rwanda's mobile internet context means the app must work comfortably in varied lighting conditions.

**Date:** Project start

---

## 8. Multilingual-Ready Structure Is Part of MVP

**Decision:** The frontend must use a string-key structure (locale files / i18n provider) from the start, even if only one language is active at launch.

**Why:** Retrofitting i18n into a hardcoded-string codebase is expensive. Building the structure now costs little and makes adding Kinyarwanda or French translations a content task rather than a refactor.

**Date:** Project start

---

## 9. Phase 1 Was Scaffolding Only — No Business Logic

**Decision:** The first coding phase focused entirely on scaffold: folder structure, routing, layouts, Prisma init, auth stubs. No business logic was implemented.

**Why:** Aligning on structure before filling in logic prevents large-scale refactors later. Scaffold-first lets the team verify the architecture before committing to implementation details.

**Date:** Project start

---

## 11. Google Auth Uses ID Token Verification (Not OAuth Redirect Flow)

**Decision:** Google authentication uses the Google Identity Services (GIS) JavaScript SDK on the frontend. The frontend receives a Google ID token (credential), sends it to `POST /api/auth/google`, and the backend verifies it using `google-auth-library`. No OAuth redirect dance.

**Why:** React SPAs are better served by the credential callback approach than a server-side redirect flow. The GIS SDK is loaded via script tag — no frontend npm package required. The backend uses `google-auth-library` to verify the token cryptographically.

**Date:** 2026-04-15

---

## 12. Google Auth Account Linking: Link by Email, No Duplicate Accounts

**Decision:** When a user signs in with Google and an account already exists with that email (registered with password), the backend links the `googleId` to the existing account rather than creating a duplicate. This happens silently on first Google sign-in.

**Why:** Creating a second account for the same email would fragment the user's booking history and cause confusion. Linking is safe because Google has verified ownership of the email.

**Date:** 2026-04-15

---

## 13. Password Reset Token: Hex String in DB (Not JWT)

**Decision:** Forgot-password tokens are random 32-byte hex strings stored in the `passwordResetToken` field on the User model with a 1-hour expiry. In development, the reset link is logged to the console. Email delivery is a Phase 2 concern.

**Why:** A hex token stored in the DB is easier to invalidate (just clear the field) and doesn't require a separate secret for verification. JWT-based reset tokens cannot be invalidated before expiry if the DB isn't checked.

**Date:** 2026-04-15

---

## 14. Role Normalization at Frontend AuthContext Boundary

**Decision:** The backend DB stores roles as uppercase enums (`PASSENGER`, `ADMIN`, `SUPER_ADMIN`, `OPERATOR`). The frontend normalizes them to lowercase underscore convention (`passenger`, `admin`, `super_admin`, `operator`) inside `AuthContext.normalizeUser()`. All frontend role checks use the normalized form.

**Why:** Keeps DB enum naming free from frontend conventions. The mapping is in one place — `AuthContext.jsx` — so any future change (e.g. adding a new role) only needs updating there.

**Date:** 2026-04-15

---

## 15. No Email Verification in MVP

**Decision:** Email verification is not implemented. Users can log in immediately after registration without confirming their email.

**Why:** Adds friction with no email infrastructure in place. Email verification is straightforward to add later once an email service (SendGrid, Resend, etc.) is configured. It does not block the auth or booking flows.

**Date:** 2026-04-15

---

## 16. Schedule Search Is Public (No Auth Required)

**Decision:** `GET /api/schedules/search` and `GET /api/schedules/:id` are public endpoints — no authentication required. `GET /api/routes` is also public.

**Why:** Passengers (and guests) must be able to browse available trips before deciding to register or log in. Requiring auth for search would break the public discovery funnel. Auth is enforced at booking creation (`POST /api/bookings`), not search.

**Date:** 2026-04-15

---

## 17. seatsAvailable Is a Denormalized Counter on Schedule

**Decision:** `Schedule.seatsAvailable` is a denormalized integer that must be decremented/incremented atomically inside a Prisma transaction when bookings are created or cancelled.

**Why:** Computing available seats from booking joins on every search query is expensive and races under concurrent writes. A counter on the schedule row is the correct pattern for a booking platform. The schema comment documents this constraint.

**Date:** 2026-04-15

---

## 18. Booking Summary Page Passes Schedule State via React Router navigate() State

**Decision:** When a passenger selects a schedule and adjusts seat count on `BookingPage`, the handoff to payment passes `{ scheduleId, seats, totalAmount, schedule }` via React Router `navigate(path, { state })`. No global store is used.

**Why:** The booking summary → payment flow is a linear, session-scoped navigation. Using router state avoids adding a global store and keeps the data close to the navigation event. The `BookingPage` re-fetches the schedule from the API independently so the data is always fresh.

**Date:** 2026-04-15

---

## 19. Passenger Login Redirects to Homepage, Not Passenger Dashboard

**Decision:** After successful login, passengers are sent to `/` (homepage). Operators, admins, and super-admins are sent to their respective dashboards.

**Why:** Passengers are browsing for trips — they don't need to land on a dashboard. Sending them to the homepage lets them immediately continue searching. Staff roles land on their dashboard because their first action is always operational.

**Date:** 2026-04-15

---

## 20. Avatar Dropdown in Navbar for Authenticated Users

**Decision:** When a user is logged in, the navbar replaces the flat "Dashboard / Sign out" buttons with an avatar button (initials) that opens a dropdown containing Profile, Dashboard, and Logout. Applies to all roles.

**Why:** Cleaner UX for a multi-role app. The avatar pattern is widely recognized; it avoids cluttering the navbar with role-specific links while still providing quick access to key actions.

**Date:** 2026-04-15

---

## 21. Shared `/profile` Route for Non-Passenger Roles [SUPERSEDED by #37]

**Decision:** A `/profile` route is registered under a catch-all ProtectedRoute (any authenticated user) and renders the same ProfilePage component. Passengers still have `/passenger/profile` from their layout. Admins, operators, and super-admins use `/profile`.

**Why:** Role-specific profile pages don't exist yet. Duplicating the route at `/admin/profile`, `/operator/profile`, etc. would require four layout wrappers for what is currently the same stub. A single shared route is simpler and safe to split later when profiles diverge.

**Date:** 2026-04-15

---

## 22. Dashboard Dark Mode Default

**Decision:** Dashboard layouts (Passenger, Admin, SuperAdmin, Operator) set dark mode on mount if no theme preference is stored in localStorage. If a preference exists, it is respected.

**Why:** Dashboard users are staff working for extended periods. Dark mode reduces eye strain in operational contexts. The public site defaults to light. The theme toggle in the navbar always overrides this default.

**Date:** 2026-04-15

---

## 23. Booking Creation Does Not Reserve Seats — Payment Confirmation Does

**Decision:** `POST /api/bookings` creates a PENDING booking without decrementing `seatsAvailable`. The `POST /api/payments/pay` endpoint runs a Prisma transaction that: creates a PAID Payment record, updates the Booking to CONFIRMED, and decrements `Schedule.seatsAvailable`. If payment fails (simulated), a FAILED Payment is created and the Booking stays PENDING with seats unchanged.

**Why:** The existing UI text already says "Seats are not reserved until payment is completed." Holding seats in PENDING state would require a timeout/cleanup job for abandoned bookings — out of scope for MVP. This approach is clean, safe, and consistent.

**Date:** 2026-04-16

---

## 24. Simulated Payment Uses a Single POST /api/payments/pay Endpoint

**Decision:** The MVP payment flow uses a single `POST /api/payments/pay` endpoint that accepts `{ bookingId, method: 'simulated' | 'fail' }`. `'simulated'` triggers a successful payment + seat decrement inside a transaction. `'fail'` creates a FAILED payment record, leaving the booking PENDING. The `'fail'` option is only exposed as a dev-testing convenience button in the UI.

**Why:** A single endpoint is simpler than separate initiate/confirm steps for a fully simulated flow. The `'fail'` path lets QA and developers test the failure state without manipulating the database directly.

**Date:** 2026-04-16

---

## 25. Booking Reference Format: RW-XXXXXXXX (8 uppercase hex chars)

**Decision:** Each booking gets a unique reference in the format `RW-A3F9C21B` (prefix `RW-` plus 8 uppercase hex characters from 4 random bytes). Generated in the application layer with a collision-retry loop (max 5 attempts). The `reference` field is `@unique` in the schema.

**Why:** Human-readable, easily dictated over the phone, short enough to print, and specific to Rwanda with the `RW-` prefix. Collision probability is negligible (4 billion combinations); the retry loop handles the theoretical edge case.

**Date:** 2026-04-16

---

## 26. Payment Retry: Update Existing FAILED Record, Not Insert New

**Decision:** Because `Payment.bookingId` is `@unique`, a booking can have at most one payment row. When a passenger retries payment after a FAILED attempt, the service updates the existing payment record (status → PAID, new transactionId) rather than creating a new one. A PAID payment record is never overwritten — the booking-status guard (`PENDING` required) prevents that path.

**Why:** The schema constraint `@unique` on `bookingId` means inserting a second payment would fail at the DB level. Updating is the correct semantic: it's the same payment attempt, corrected.

**Date:** 2026-04-16

---

## 27. Cancel Booking: PENDING Only, No Refund in MVP

**Decision:** `PATCH /api/bookings/:id/cancel` is available only for `PENDING` bookings. Confirmed bookings cannot be cancelled via this endpoint in MVP. No refund logic is implemented. The booking status is set to `CANCELLED`; the FAILED payment record (if any) is left as a historical record.

**Why:** MVP does not include refund workflows (Phase 2). Allowing cancellation only on PENDING bookings (where no seats have been decremented and no money has been collected) keeps the logic safe and clean.

**Date:** 2026-04-16

---

## 28. Register: Email OR Phone Required (Not Both)

**Decision:** Registration requires at least one of email or phone. Providing both is allowed. Where phone is provided, Rwanda validation applies (`^07(2|3|8|9)\d{7}$`). Enforced via Zod `superRefine` on backend; JS guard on frontend.

**Why:** Not everyone in Rwanda has a consistent email address, but they do have a phone. Requiring both excluded valid users. Requiring at least one is the correct minimal constraint.

**Date:** 2026-04-16

---

## 29. Duplicate Booking Prevention: Block PENDING/CONFIRMED on Same User + Schedule

**Decision:** Before creating a booking, the service checks for an existing booking by the same `userId` + `scheduleId` where status is `PENDING` or `CONFIRMED`. If found, creation is rejected with a 409 and the message "You already have a booking for this trip." Bookings with status `CANCELLED` or `COMPLETED` do not block a new booking.

**Why:** Accidental duplicate bookings waste seats and confuse passengers. The guard belongs in the service layer, not the route, keeping the controller thin.

**Date:** 2026-04-16

---

## 30. Profile Update: Email and Phone Are Mutable, With Uniqueness Checks

**Decision:** `PATCH /api/users/me` accepts `name`, `email`, and `phone`. Empty string means "clear the field." Uniqueness is only checked when the new value differs from the current stored value, preventing false "already in use" errors when submitting unchanged data.

**Why:** The original `updateUser` only accepted `name` and `phone`, blocking users from changing their email. Uniqueness skip-on-unchanged is required to avoid confusing validation failures.

**Date:** 2026-04-16

---

## 31. Account Deletion: Hard Delete With Cascade

**Decision:** `DELETE /api/users/me` permanently deletes the user row. Cascade rules on the schema ensure `Booking` rows (and their `Payment` rows) are deleted automatically. Refresh tokens are explicitly deleted first to terminate all sessions immediately. A confirmation step (type "DELETE") is required on the frontend before the request is sent.

**Why:** Since the migration has not yet run, cascade rules (`onDelete: Cascade`) were added to the schema for `Booking.user` and `Payment.booking`. This keeps hard delete clean without manual cleanup of child records. There is no soft-delete fallback — the user is informed this is permanent.

**Date:** 2026-04-16

---

## 10. Payments Are Simulated in MVP

**Decision:** The MVP payment flow is fully simulated. No live gateway (MTN MoMo, Airtel, card) is integrated.

**Why:** Live payment integrations require merchant accounts, KYC, compliance, and testing overhead that would delay the MVP significantly. A simulated flow lets the full booking UX be built and validated end-to-end before real money is involved.

**Date:** Project start

---

## 33. Boarding Lookup: Token/Reference Only [SUPERSEDED by #34]

**Decision:** `GET /api/boarding/lookup` accepts only a booking reference (`RW-XXXXXXXX` format). Phone and email lookup were removed. The query is validated against the reference regex before the service is called. The endpoint returns an array of 0 or 1 booking.

**Why:** The product rule is that a passenger presents their booking token/reference at boarding. Operators look up that specific reference. Phone/email search was added in error; it was not part of the agreed product flow. Removing it keeps the boarding flow unambiguous and avoids leaking passenger contact details through a broader search.

**Date:** 2026-04-17

---

## 34. Operator Company Bookings Endpoint

**Decision:** A new `GET /api/bookings/operator-company` endpoint, restricted to the `OPERATOR` role, returns all bookings for the operator's company. The response shape is `{ company: { id, name }, bookings: [...] }`. Each booking includes: passenger name/phone, reference, route, departure time, seatsBooked, schedule.seatsAvailable (remaining seats), booking status, payment status. Scoping is enforced in the service layer using the operator's `companyId`.

**Why:** Operators need visibility into who has booked their company's trips and how many seats remain, without needing admin access. The operator bookings view reuses existing booking/schedule data and follows the same company-scope pattern as boarding validation.

**Date:** 2026-04-17

---

## 35. Email Sending: Nodemailer + Gmail SMTP with App Password

**Decision:** Password reset emails are sent via Nodemailer using Gmail SMTP (host: `smtp.gmail.com`, port 587, STARTTLS). Authentication uses a Gmail App Password stored in `SMTP_PASS`. The sender address is the Gmail account in `SMTP_USER`. Frontend reset link uses `FRONTEND_URL` env var (default: `http://localhost:5173`).

**Why:** Decision #13 deferred email delivery to "Phase 2" but the reset flow is in scope and already generates a token. Nodemailer with a Gmail App Password is the simplest working setup with no external service dependency. The transporter is lazy-initialized (singleton) to avoid creating a connection on cold start if env vars are missing.

**Date:** 2026-04-18

---

## 32. Boarding Validation Uses Existing COMPLETED Status in MVP

**Decision:** Operator boarding validation looks up bookings by the existing `reference` field and, on successful validation, moves `Booking.status` from `CONFIRMED` to the existing `COMPLETED` enum value. Boarding metadata is stored on the booking via `boardedAt`, `boardedById`, and optional `boardingNote`. Operator-company scope is enforced in the service layer; `ADMIN` and `SUPER_ADMIN` can validate without company restriction.

**Why:** This is the narrowest safe rollout for boarding. It avoids introducing a new `BOARDED` enum and a broader lifecycle refactor while still recording who validated boarding and when. The operator UI can present `COMPLETED` as "Boarded" for this phase.

**Date:** 2026-04-17


## 36. Global i18n: Custom Context, 4 Languages, Flat Key Namespace

**Decision:** Multilingual support uses a custom React Context (`LanguageContext`) with a single `translations.js` flat key-value map. Supported languages: English (`en`), Kinyarwanda (`rw`), French (`fr`), Kiswahili (`sw`). No external i18n library. Simple `{var}` interpolation added to `t(key, vars)`. Language persisted in `localStorage` under `rugendo-lang`.

**Why:** The custom context was already in place and well-structured. Adding react-i18next would be an unnecessary dependency. Flat namespace keeps lookups simple and matches existing patterns. Kiswahili added as the fourth language per product requirements.

**Date:** 2026-04-18

---

## 37. Dashboard Roles Own Their Profile Routes

**Decision:** Admin, super-admin, and operator profile pages live on layout-owned routes nested under their respective dashboard layouts: `/admin/profile`, `/super-admin/profile`, and `/operator/profile`. Passengers keep `/passenger/profile`. The generic `/profile` path remains only as a role-aware compatibility redirect to the correct role-specific route.

**Why:** The shared non-passenger `/profile` route bypassed the admin and super-admin layout wrappers, which dropped users out of the dashboard shell when they opened Profile. Reusing the operator pattern keeps profile rendering inside the correct layout while preserving old `/profile` links and bookmarks.

**Date:** 2026-04-18

---

## 38. Operator Management Uses the Existing User Model

**Decision:** Super-admin operator management is implemented on top of `User` rows where `role = OPERATOR` and `companyId` points to the assigned company. The `/api/operators` endpoints are a filtered management surface over that existing model: list/search/filter operators, create an operator user, toggle `isActive`, and change `companyId`. No separate `Operator` model was introduced.

**Why:** The Prisma schema already defines operators as users with role-based access, and the rest of the app already depends on that shape for auth, dashboard access, and company-scoped boarding logic. Reusing the existing model keeps auth and permissions consistent, avoids schema churn, and matches the previously implemented `ManageUsers` role-management flow.

**Date:** 2026-04-18

---

## 39. Bus Management Reuses the Existing Bus Model and Preserves Schedule Integrity

**Decision:** Admin bus management is implemented directly on the existing `Bus` model. The `/api/buses` module now provides list/search/filter, create, update, status toggle, and company-option endpoints for `ADMIN` and `SUPER_ADMIN`. Company reassignment is blocked once a bus has schedules, and capacity cannot be reduced below the highest `Schedule.seatsTotal` already configured for that bus.

**Why:** The Prisma schema already models buses as company-owned fleet records, and schedules duplicate both `companyId` and seat totals. Allowing unrestricted company or capacity changes after schedules exist would silently desynchronize buses from their schedules or make existing seat configurations invalid. These guards preserve data integrity without schema changes.

**Date:** 2026-04-18

---

## 40. Driver Management Reuses the Existing Driver Model and Preserves Schedule Integrity

**Decision:** Admin driver management is implemented directly on the existing `Driver` model. The `/api/drivers` module now provides list/search/filter, create, update, status toggle, and company-option endpoints for `ADMIN` and `SUPER_ADMIN`. Company reassignment is blocked once a driver has schedules, because `Schedule` already stores both `driverId` and `companyId`.

**Why:** The Prisma schema already models drivers as company-owned operational records, and schedule rows duplicate company ownership. Allowing company changes after schedules exist would create a driver/company mismatch against existing schedules. Blocking that change preserves integrity without adding new schema or assignment tables.

**Date:** 2026-04-18

---

## 41. Route Management Reuses the Existing Route Model and Preserves Public Listing Compatibility

**Decision:** Admin route management is implemented directly on the existing `Route` model. The `/api/routes` module keeps the public active-list response as the default `GET /api/routes` behavior, and adds admin listing when the same endpoint is called with `scope=admin` by an `ADMIN` or `SUPER_ADMIN` user. Route CRUD adds create, update, and status-toggle operations without schema changes. Origin and destination must differ, duplicate origin+destination pairs are blocked, and origin/destination edits are blocked once schedules already exist for that route.

**Why:** The project already exposed `GET /api/routes` publicly for passenger-facing route discovery, so replacing it with an admin-only payload would break an agreed API surface. Reusing the existing `Route` model keeps the admin batch narrow, while locking endpoint changes after schedules exist preserves schedule and booking integrity because those records already depend on the route semantics.

**Date:** 2026-04-18

---


## 42. Schedule Deactivation Uses status=CANCELLED, Not Hard Delete

**Decision:** Admin schedule management never hard-deletes a schedule row. Cancelling a schedule sets `status = 'CANCELLED'`. Hard delete is not provided.

**Why:** Bookings and payments reference `scheduleId`. Hard-deleting a schedule with historical bookings would leave orphaned foreign keys and break booking history and payment records. Soft-cancel preserves all references while making the schedule invisible to passengers.

**Date:** 2026-04-19

---

## 43. Booking-Protection Rules on Schedule Updates

**Decision:** When a schedule has PENDING or CONFIRMED bookings, the following fields are locked for updates: `departureTime`, `arrivalTime`, `price`, `seatsTotal`. Other fields (bus, driver, company, status transitions) may still be updated. Cancellation is also blocked while active bookings exist.

**Why:** Changing departure time, price, or seat count after a passenger has paid creates a contract violation. Blocking only these fields keeps admins able to fix operational data (driver swap, bus swap) without violating passenger expectations. seatsAvailable is adjusted atomically when seatsTotal changes on an unbooked schedule to keep the denormalized counter consistent.

**Date:** 2026-04-19

---

## 44. Admin GET /api/schedules Uses the Same Route Path as Public, Differentiated by Auth

**Decision:** `GET /api/schedules` is now the admin listing endpoint (requires ADMIN/SUPER_ADMIN token). Public schedule access remains `GET /api/schedules/search` (unchanged). `GET /api/schedules/:id` remains public. Admin detail is at `GET /api/schedules/admin/:id`.

**Why:** The original stub already reserved `GET /api/schedules/` for admin use. The public passenger flow only uses `/search` and `/:id`. Registering the admin routes before `/:id` in Express prevents the wildcard from swallowing the admin routes. No change to the public API surface.

**Date:** 2026-04-19

---

## 46. Admin Booking Management Is Read-Only in MVP

**Decision:** The admin booking management view (`GET /api/bookings`, `GET /api/bookings/admin/:id`) is read-only. Admins can filter, paginate, and inspect any booking and its payment record, but cannot mutate booking status or payment status.

**Why:** Booking state is tightly coupled to payment state (Decision #23/#26). Allowing arbitrary admin status changes without corresponding payment-side checks would risk data inconsistency (e.g., setting a PENDING booking to CONFIRMED without a PAID payment row). Read-only access gives operational visibility with zero risk of payment/booking desynchronization. Status mutation can be added in a follow-up batch with explicit guard logic.

**Date:** 2026-04-19

---

## 45. Schedule Duplicate Prevention: routeId + busId + departureTime Uniqueness for SCHEDULED/IN_PROGRESS

**Decision:** Creating a schedule with the same `routeId`, `busId`, and `departureTime` as an existing SCHEDULED or IN_PROGRESS schedule is rejected with 409. COMPLETED and CANCELLED schedules are excluded from the duplicate check.

**Why:** A bus cannot be in two places at the same time. Excluding historical statuses allows rescheduling on the same route/bus after a prior run has completed or been cancelled.

**Date:** 2026-04-19

---

## 47. Auth Panel Uses a Public Live Summary Endpoint Instead of Stored Marketing Claims

**Decision:** The auth layout’s left-side panel is now backed by a public `GET /api/settings/auth-panel` endpoint. It returns real database-backed values only: active route count, today’s departure count (using the Rwanda/Kigali day boundary), active bus company count, and optional support contact settings when present. Unsupported marketing claims such as hardcoded payment-method or digital-boarding copy are not shown there.

**Why:** The previous auth-panel content displayed fake numbers and feature claims that were not sourced from the database or settings. A small public summary endpoint keeps the implementation narrow, avoids overloading protected admin endpoints, and ensures login/register pages only show live, defensible platform data.

**Date:** 2026-04-19

---

## 48. Demo Seed Deterministically Rebuilds Operational Trip Data

**Decision:** `backend/prisma/seed.js` now treats schedules, bookings, and payments as deterministic demo data. On each run it clears those operational tables, preserves user/auth records, then upserts the demo companies, operators, buses, drivers, and routes before generating route coverage for today plus the next 5 days. It also creates booking fixtures that respect the current booking/search rules and seat-counter behavior.

**Why:** The earlier seed left some active routes without schedules, skipped tomorrow in its date coverage, and seeded booking states that did not fully match business rules. Resetting only operational trip data keeps the seed rerunnable and predictable without wiping auth/admin accounts, while ensuring the UI and booking flow always see populated, bookable demo trips.

**Date:** 2026-04-19

---

## 50. Dashboard Topbar Always Visible; Language + Theme Moved Out of Sidebar

**Decision:** The sticky topbar in all four dashboard layouts (`AdminLayout`, `SuperAdminLayout`, `PassengerLayout`, `OperatorLayout`) is now visible on all viewport sizes, not just mobile. Language selector and theme toggle are rendered in the topbar's right side. The sidebar no longer shows language/theme controls; it shows only navigation links and a logout button.

**Why:** Having language and theme controls at the bottom of a collapsible sidebar is low-discoverability and unavailable on desktop without scrolling. The topbar is always on screen and is the natural home for viewport-wide controls. The sidebar remains focused on navigation.

**Date:** 2026-04-19

---

## 51. Sidebar Icons: Inline SVG, No External Library

**Decision:** Sidebar navigation items now include inline SVG icons (Heroicons-style, 20×20, stroke-based). No icon library dependency was added. Icons are defined in a `ICONS` map keyed by semantic name, referenced from the `NAV_LINK_KEYS` config via an `icon` field.

**Why:** Adding lucide-react or react-icons for sidebar-only use would be an unnecessary dependency. Inline SVGs keep the bundle lean, inherit `currentColor` for active/inactive state, and have no runtime overhead.

**Date:** 2026-04-19

---

## 52. Timeseries Chart Error Handling: Explicit tsError State

**Decision:** Both `AdminDashboard` and `SuperAdminDashboard` now track a separate `tsError` boolean for the `/dashboard/timeseries` API call. On failure, an amber warning banner renders above the charts with a retry link. The `allZero` guard was fixed to require `data.length > 0` before declaring all values zero, preventing vacuous-true empty-state for failed (empty) fetches.

**Why:** The previous catch block silently set `loadingTs=false` without flagging an error. Empty arrays cause `[].every(fn)` to return `true` (vacuous truth), so a network failure was indistinguishable from a legitimate "no bookings" state — both showed the same "No data" message. Explicit error state gives users actionable feedback and the ability to retry.

**Date:** 2026-04-19

---

## 49. Company Management Uses Deactivation, Not Hard Delete

**Decision:** Super-admin company management is implemented as list/create/update plus `isActive` activation toggling. Hard delete is not provided. A company cannot be deactivated while it still has `SCHEDULED` or `IN_PROGRESS` schedules.

**Why:** The `Company` model is referenced by operators (`User.companyId`), buses, drivers, and schedules. Hard delete would risk relational breakage and orphaned operational records. Blocking deactivation while active schedules exist keeps the public booking flow from exposing trips for a company that has been administratively turned off, without introducing cascade deletes or broad side effects in unrelated modules.

**Date:** 2026-04-19

---

## 53. Users Page: Eye Icon View Modal Instead of Inline Details

**Decision:** On `/super-admin/users`, email, phone, and company are removed from the list row and moved into a `UserDetailModal` opened by an eye icon button. The list row now shows only name, role badge, and status badge, with the eye, change-role, and deactivate actions in the action area.

**Why:** Inline contact details made the list cluttered and hard to scan for user status at a glance. A view modal is the standard pattern when rows need to carry secondary information that is only occasionally needed. Existing role change and status toggle actions are preserved in the modal row and within the modal's footer area.

**Date:** 2026-04-19

---

## 55. Company Admin Role Is Company-Scoped

**Decision:** The platform now includes `company_admin` / `COMPANY_ADMIN` as a company-scoped management role backed by `User.companyId`. Company admin APIs live under `/api/company-admin/*` and enforce the authenticated user's company scope server-side. Operators remain boarding/check-in only, public signup remains passenger-only, official RURA route/fare data remains platform-controlled, and company profile is read-only for this MVP.

**Why:** Bus companies need internal operations access without giving boarding operators broad management powers or exposing other companies' data. A dedicated scoped role preserves tenant boundaries while keeping platform admin and super-admin workflows separate.

**Date:** 2026-04-28

---

## 54. Dashboard Chart Empty State: Role-Specific Messages

**Decision:** The `TimeseriesLineChart` in both admin and super-admin dashboards now receives contextual `empty` messages from the caller: `'…'` while loading, `t('adminChartError')` on fetch failure, and `t('adminChartNoRecentData')` when data is returned but all 14-day values are zero. Two new translation keys (`adminChartNoRecentData`, `adminChartError`) added across all 4 languages.

**Why:** The generic `adminEmptyState` ("No data yet") was shown even when KPI cards showed existing bookings — misleading users into thinking the chart was broken. Distinct messages for loading/error/no-recent-data make the chart's state unambiguous.

**Date:** 2026-04-19

---
