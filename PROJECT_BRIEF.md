# PROJECT_BRIEF.md — Rugendo Rwanda

## Project Summary

**Rugendo Rwanda** is an online intercity bus booking platform for Rwanda.
It serves two audiences simultaneously:
- **Passengers** — search routes, view schedules, book seats, pay, receive booking references, manage upcoming and past trips.
- **Operations staff** — admins, super-admins, and operators managing routes, schedules, buses, drivers, bookings, payments, and boarding validation.

This is not a pure passenger-facing site. Operational workflows are first-class citizens of the MVP.

---

## Product Goal

Provide a reliable, role-aware intercity bus booking system that:
- Gives passengers a smooth end-to-end booking experience (search → book → pay → reference → manage).
- Gives operators a dashboard to manage the full operational lifecycle of a route.
- Is architected to grow into live payment gateways, SMS notifications, QR boarding, and bus tracking in a later phase — without needing a rewrite.

---

## Agreed Stack

### Frontend
| Item | Choice |
|---|---|
| Framework | React.js |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Language | JavaScript / JSX only (no TypeScript) |
| Routing | React Router |

### Backend
| Item | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | JavaScript with ES modules (no CommonJS) |
| Database | MySQL |
| ORM | Prisma |
| Auth | JWT + refresh tokens |
| Passwords | bcrypt |
| API style | REST |
| Payments | Simulated in MVP |
| Cache layer | None (no Redis in MVP) |

---

## Roles

| Role | Description |
|---|---|
| `guest` | Unauthenticated visitor. Can search and view schedules. Cannot book. |
| `passenger` | Registered user. Can book, pay, and manage their own trips. |
| `admin` | Operations staff. Manages routes, schedules, buses, drivers, bookings, payments. |
| `super_admin` | All admin permissions plus platform-wide settings and appearance controls. |
| `operator` | Handles boarding validation at departure. No separate boarding-agent role exists. |

### Role Rules
- `super_admin` is a superset of `admin` — everything admin can do, plus platform settings.
- `operator` is scoped strictly to boarding validation. They do not manage routes or bookings.
- There is no separate "boarding agent" role; `operator` covers that responsibility.

---

## MVP Scope

### Passenger-facing
- Homepage
- Register / Login / Logout
- Forgot password / Reset password
- Basic profile management
- Route search
- Schedule listing
- Booking summary
- Payment selection (simulated)
- Simulated payment flow
- Booking confirmation with unique booking token / reference
- My bookings (upcoming)
- Past trips
- Booking details page
- Multilingual-ready structure (strings ready to be translated; full i18n is Phase 2)
- Dark / light mode toggle

### Admin & Operations
- Admin login and dashboard
- Super-admin login and dashboard
- Operator login and dashboard
- User management
- Operator / company management
- Bus management
- Driver management
- Route management
- Schedule management
- Booking management
- Payment record management
- Reports / analytics summary
- Operator boarding validation flow
- Super-admin platform settings / appearance controls

### System Essentials
- Role-based route protection (frontend and backend)
- Request validation on all API endpoints
- Defined booking statuses (e.g. `pending`, `confirmed`, `cancelled`, `completed`)
- Defined payment statuses (e.g. `pending`, `paid`, `failed`, `refunded`)
- Responsive design (mobile-first)
- Empty states for all list views
- Proper loading / error / success handling throughout

---

## Phase 2 Features (Intentionally Excluded Now)

These are confirmed out of scope for MVP. Do not implement them:

- Live MTN MoMo integration
- Live Airtel Money integration
- Live card payment integration
- SMS notifications
- QR code boarding
- Loyalty / referral system
- Live bus tracking
- Automated refunds

---

## Current Scaffold Status (as of project start)

- Frontend scaffold created (Vite + React + Tailwind, role-based layouts scaffolded)
- Backend scaffold created (Express, modular structure, ES modules)
- Prisma initialized
- Auth foundation scaffolded (routes/controllers exist but business logic is stubbed)
- Role-based frontend pages scaffolded (layouts exist, content is placeholder)
- Major business logic is still pending across the board

---

## Immediate Next Implementation Priority

1. Review and verify Prisma schema against all business requirements
2. Refine schema if gaps are found
3. Run initial Prisma migration against MySQL
4. Implement auth end-to-end (register, login, refresh, logout, forgot/reset password)
5. Connect frontend auth screens to backend API
6. Implement `/api/me` endpoint
7. Implement role-based redirects after login
8. Confirm theme (dark/light) and language switching scaffolding works cleanly
