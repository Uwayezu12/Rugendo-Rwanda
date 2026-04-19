# AGENTS.md — Rugendo Rwanda

Working guide for AI coding agents (Claude Code, Codex, etc.) operating in this repository.
Read this file before making any changes. It is the authoritative source of architectural constraints and workflow rules for this project.

---

## Project Context

**Rugendo Rwanda** is an online intercity bus booking platform for Rwanda.
It has two audiences: passengers (public-facing booking flow) and operations staff (admin, super-admin, operator dashboards).
Both are first-class citizens of the MVP — not one primary and one secondary.

See `PROJECT_BRIEF.md` for full product context, MVP scope, and excluded features.

---

## Required Mindset

Treat this as a **real, production-bound booking platform**, not a visual prototype.

- Every API endpoint must validate input and return meaningful error responses.
- Business logic must be correct, not just present. A stub that returns 200 with fake data is not a complete implementation.
- Auth must be secure: hashed passwords, short-lived access tokens, refresh token rotation, protected routes.
- Booking tokens must be unique and human-readable (not just a UUID dump).
- Do not add placeholder data that would survive into a real user's session.

---

## Agreed Stack

### Frontend
- React.js + Vite + Tailwind CSS
- JavaScript / JSX only — no TypeScript
- React Router for navigation

### Backend
- Node.js + Express.js
- JavaScript with ES modules (`import`/`export`) — never `require()`
- MySQL + Prisma ORM
- JWT for access tokens, refresh tokens stored and invalidated in DB
- bcrypt for password hashing
- REST API
- No Redis, no external cache layer

---

## Roles and Role Rules

| Role | Scope |
|---|---|
| `guest` | Unauthenticated. Read-only public access. |
| `passenger` | Authenticated. Booking and trip management only. |
| `admin` | Full operational access: routes, schedules, buses, drivers, bookings, payments. |
| `super_admin` | All admin permissions + platform settings. |
| `operator` | Boarding validation only. |

- `super_admin` is a superset of `admin`. Implement permission checks accordingly.
- There is no separate "boarding agent" role. `operator` covers it.
- Never invent new roles without explicit agreement.

---

## Frontend Architecture Rules

- Role-based layouts must stay separated: `PassengerLayout`, `AdminLayout`, `SuperAdminLayout`, `OperatorLayout`.
- Do not collapse layouts into a single generic layout unless explicitly agreed.
- All user-facing strings must go through the i18n/locale system — never hardcode display text.
- Theme (dark/light) must be controlled via a context/provider, not inline toggling.
- React Router `<Route>` elements must enforce role protection via a guard component — do not rely on hiding UI elements as the only protection.
- State management: use React context for auth state and theme. Do not introduce Redux, Zustand, or any global state library without agreement.
- Do not install new npm packages without flagging the addition.

---

## Backend Architecture Rules

- Use ES modules exclusively (`import`/`export`). If you see `require()`, flag it as a bug.
- Follow the established module structure: `routes/` → `controllers/` → `services/` (if applicable) → `prisma/`.
- Every route must go through input validation middleware before reaching the controller.
- Auth middleware (`requireAuth`, `requireRole`) must be applied to every protected route — not optional.
- Refresh tokens must be stored in the database and invalidated on logout and rotation.
- Prisma queries must be wrapped in try/catch; never let unhandled Prisma errors reach the client.
- HTTP status codes must be semantically correct: 200, 201, 400, 401, 403, 404, 409, 422, 500.
- Never log sensitive data (passwords, tokens, PII) to the console.

---

## Scope Rules

### Include in current work
- Everything listed in `TASKS.md` under the current phase and near-next sections.
- Bug fixes listed in `BUGS.md`.
- Schema refinements needed before migration.

### Do NOT add yet
- Live payment gateways (MTN MoMo, Airtel, card) — Phase 2.
- SMS notifications — Phase 2.
- QR code boarding — Phase 2.
- Loyalty / referrals — Phase 2.
- Live bus tracking — Phase 2.
- Automated refunds — Phase 2.
- Redis or any external cache layer — not in MVP.
- TypeScript migration — not planned.
- Any third-party service integration not already in the scaffold.

---

## Workflow Rules

1. **Inspect before changing.** Read the relevant files before modifying architecture or adding new modules. The scaffold may already have the structure you're about to create.

2. **Update the memory files.** After completing a meaningful batch of work:
   - Mark done items in `TASKS.md`.
   - Log any new architectural decisions in `DECISIONS.md`.
   - Log any confirmed bugs in `BUGS.md` (and move fixed ones to RESOLVED).

3. **Prefer small, clear batches.** Implement one logical unit at a time (e.g., "auth backend", "auth frontend", "route search backend"). Do not mix unrelated concerns in a single session.

4. **Flag risky assumptions.** If a requirement is ambiguous or a schema decision has major downstream effects, stop and flag it rather than inventing a solution. Describe the tradeoff and ask.

5. **Do not auto-commit.** Never run `git commit` or `git push` unless explicitly instructed by the user for this session.

---

## Current Next Priority

In order:

1. Review Prisma schema against all business requirements
2. Refine schema if gaps found (roles, statuses, relations, seat model, booking token field)
3. Configure `.env` and run initial migration
4. Implement auth end-to-end on backend (register, login, refresh, logout, forgot/reset password)
5. Implement `GET /api/me`
6. Connect frontend auth screens to backend
7. Implement role-based redirects after login
8. Verify protected routes (frontend + backend)
9. Verify theme and language switching scaffold
