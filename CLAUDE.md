# CLAUDE.md — Rugendo Rwanda

Claude-specific guidance for working in this repository.

---

## Read These First

Before doing anything, read:

1. `PROJECT_BRIEF.md` — full product context, stack, roles, MVP scope, excluded features
2. `TASKS.md` — current phase, pending tasks, completed work
3. `DECISIONS.md` — architectural decisions already made (do not re-open them without cause)
4. `BUGS.md` — known open issues
5. `AGENTS.md` — architectural rules, scope constraints, workflow rules

---

## Project Goal

Build **Rugendo Rwanda** — a production-quality intercity bus booking platform for Rwanda.

This is not a demo. It is an operational platform with two audiences:
- **Passengers** — search, book, pay, manage trips.
- **Operations staff** — manage routes, schedules, buses, drivers, bookings, payments, and boarding.

Both audiences are in MVP scope.

---

## Current Implementation State

- Frontend and backend are scaffolded (folder structure, layouts, stub routes, Prisma init).
- Auth controllers exist but business logic is entirely stubbed.
- No migration has been run yet. The database is empty.
- No endpoint currently does meaningful work.
- Major business logic is pending.

---

## Immediate Next Task Focus

Work through these in order. Do not skip ahead.

1. **Review Prisma schema** — check against roles, booking statuses, payment statuses, schedule ↔ booking ↔ payment relations, seat reservation model, booking token field.
2. **Refine schema if needed** — fix gaps before migrating.
3. **Run initial migration** — `npx prisma migrate dev --name init` against the configured MySQL database.
4. **Implement auth end-to-end** — register, login, refresh token rotation, logout, forgot password, reset password. Secure implementation: hashed passwords, short-lived access tokens, refresh tokens stored and invalidated in DB.
5. **Connect frontend auth screens to backend** — register, login, forgot password, reset password pages must call real API endpoints and handle responses correctly.
6. **Implement `GET /api/me`** — return current user profile from a valid access token.
7. **Verify role-based redirects and protected routes** — correct post-login destination per role, correct blocking of unauthorized access on both frontend and backend.

---

## Do Not Do Yet

These are explicitly out of scope. Do not implement, scaffold, or stub them:

- Redis or any in-memory cache layer
- Live payment gateways (MTN MoMo, Airtel Money, card processors)
- SMS notifications
- QR code boarding
- Loyalty or referral system
- Live bus tracking
- Automated refunds
- TypeScript migration
- Any Phase 2 feature listed in `PROJECT_BRIEF.md`

Also:
- Do not flatten the folder structure. The current module separation is intentional.
- Do not mix CommonJS (`require`) with ES modules (`import`). Backend is ES modules only.
- Do not introduce new global state libraries (Redux, Zustand, Jotai, etc.) without agreement.
- Do not install new dependencies without flagging them.

---

## Backend Implementation Standards

- ES modules only. `import`/`export` everywhere. Never `require()`.
- Validate all request input before it reaches controller logic.
- Apply `requireAuth` and `requireRole` middleware to every protected route.
- Wrap all Prisma calls in try/catch. Return structured error responses, not raw stack traces.
- Use correct HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 422, 500.
- Never log passwords, tokens, or PII.
- Refresh tokens: store in DB, rotate on use, delete on logout.
- Access tokens: short-lived (15 min). Refresh tokens: longer-lived (7 days or configurable).

---

## Frontend Implementation Standards

- JavaScript / JSX only. No TypeScript.
- All display strings through the i18n/locale system. No hardcoded user-visible text.
- Theme (dark/light) through context/provider only. No ad-hoc class toggling.
- Role-based route guards must block at the route level, not just hide UI elements.
- Keep role layouts separated: `PassengerLayout`, `AdminLayout`, `SuperAdminLayout`, `OperatorLayout`.
- Auth state in React context. No third-party state manager.

---

## When to Stop a Coding Session

Stop and check in with the user when:

- The Prisma schema needs a decision that affects multiple models (e.g., how seats are modelled, whether booking tokens are generated in DB or application layer).
- A security-sensitive implementation choice is unclear (e.g., where to store refresh tokens on the client).
- A task is significantly larger than the batch described — do the smaller piece and report.
- You encounter files that look inconsistent with the agreed stack (e.g., CommonJS files, unexpected dependencies).

---

## After Each Meaningful Batch

Always update:

- `TASKS.md` — mark completed items, add any discovered sub-tasks.
- `DECISIONS.md` — log any new architectural decisions made during implementation.
- `BUGS.md` — log any confirmed bugs found; move fixed bugs to RESOLVED.

---

## Commit Policy

Do not run `git commit` or `git push` unless the user explicitly asks for it in the current session.
When asked to commit, stage only the relevant files — never use `git add -A` blindly.
