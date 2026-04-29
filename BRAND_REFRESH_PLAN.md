# BRAND_REFRESH_PLAN.md — Rugendo Rwanda Frontend Brand Refresh

## Status: PENDING (saved handoff — not yet implemented)

This file is the authoritative handoff plan for the Rugendo Rwanda frontend brand refresh.
It was written at the end of a planning session that hit the context limit before implementation began.
**No frontend styling has been changed yet. No backend code has been touched. No commits have been made.**

---

## Goal

Move the entire frontend away from the old purple/magenta brand style and toward a premium,
Rwanda-inspired visual identity. The design must remain clean, professional, modern, and beautiful —
not a raw flag-color exercise.

---

## Approved Color Direction

| Role | Color | Hex |
|---|---|---|
| Primary | Royal / Cobalt Blue | `#2563EB` |
| Supporting | Forest Green | `#16A34A` |
| Accent | Warm Gold | `#D97706` |
| Dark background | Navy dark | `#071524` |
| Dark surface | Navy surface | `#112040` |
| Dark border | Navy border | `#1E3A5F` |
| Light muted surface | Ice blue | `#F0F7FF` |
| Light border | Pale blue | `#DBEAFE` |

**Usage hierarchy:**
- Blue must dominate — primary buttons, active states, links, gradients, brand accents.
- Green supports — success states, secondary CTAs, supporting badge accents.
- Gold is sparing — highlights, star ratings, premium badges, call-to-action accents only where warranted.
- Avoid raw flat flag colors. All tones must be refined and premium-feeling.

---

## Logo / Image Direction

- Use the uploaded Rugendo Rwanda logo/brand image as the main logo.
- Preserve meaning and content exactly. Do not distort.
- Compact usage in navbars, sidebars, and app shells.
- If used in the homepage hero, present tastefully and professionally.
- Current hero illustration may be replaced or reduced if a cleaner hero serves the brand better.

---

## Files to Inspect at Implementation Start

Before changing anything, read these files in full:

| File | Purpose |
|---|---|
| `frontend/tailwind.config.js` | Color token overrides and theme extensions |
| `frontend/src/styles/index.css` | Global CSS variables, dark/light mode roots |
| `frontend/src/styles/design-system.js` | Design tokens used across components |
| `frontend/src/components/common/Navbar.jsx` | Public navbar brand area |
| `frontend/src/layouts/PassengerLayout.jsx` | Passenger dashboard shell |
| `frontend/src/layouts/AdminLayout.jsx` | Admin dashboard shell |
| `frontend/src/layouts/SuperAdminLayout.jsx` | Super-admin dashboard shell |
| `frontend/src/layouts/OperatorLayout.jsx` | Operator dashboard shell |
| `frontend/src/pages/public/HomePage.jsx` | Public homepage hero |
| `frontend/src/pages/public/SearchPage.jsx` | Trip search page |
| `frontend/src/pages/auth/*` | Login, register, forgot/reset password pages |
| `frontend/public/` or `frontend/src/assets/` | Image and logo assets |

Also check for any shared component files that carry purple/magenta brand styles.

---

## Implementation Rules

1. **Start in Plan mode.** Read this file first. Confirm intended files. Then implement.
2. **Do not blindly global find-replace colors.** Targeted replacement only.
3. Replace old purple/magenta only where it represents brand: gradients, active states, buttons, badges, cards, shadows, UI accents.
4. **Do not replace semantic status colors.** Error red, warning yellow, success green are not brand colors — leave them alone.
5. Do not change any backend files.
6. Do not change auth logic, booking logic, payment logic, company admin permissions, seed data, route logic, or any business logic.
7. Do not change translation keys or translation files unless new visible user-facing text is added.
8. Preserve dark/light mode. Dark mode should move from purple-black to navy-blue. Light mode stays clean white/ice-blue.
9. Preserve responsive layout at all breakpoints.
10. Preserve accessibility and contrast ratios. Blue-on-white and white-on-blue must be legible.
11. Do not commit until visual verification is complete.

---

## Pages to Verify After Implementation

Go through every page in both dark mode and light mode. Check mobile, tablet, and desktop:

**Public pages:**
- [ ] Home page (hero, features, CTAs)
- [ ] Search trips / route search page
- [ ] Routes listing page
- [ ] How it works page

**Auth pages:**
- [ ] Login page
- [ ] Register page
- [ ] Forgot password page
- [ ] Reset password page

**Passenger dashboard:**
- [ ] Dashboard home / KPIs
- [ ] My bookings
- [ ] Profile

**Operator dashboard:**
- [ ] Dashboard home
- [ ] Boarding page
- [ ] Operator bookings page
- [ ] Profile

**Company admin dashboard:**
- [ ] Dashboard home
- [ ] Bookings view
- [ ] Schedules view
- [ ] Buses / drivers / operators

**Admin dashboard:**
- [ ] Dashboard home
- [ ] Bookings management
- [ ] Schedules management
- [ ] Routes / companies / buses / drivers / operators

**Super-admin dashboard:**
- [ ] Dashboard home
- [ ] Users management
- [ ] All operational management pages

**Cross-cutting:**
- [ ] Light mode — all pages
- [ ] Dark mode — all pages
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1280px width)

---

## Build and Validation Checklist

After implementation, run:

```bash
cd frontend
npm run build
```

Then manually verify:

- [ ] New logo appears correctly in navbar, sidebar, and any hero usage.
- [ ] Logo is not stretched, blurry, or cut off.
- [ ] Homepage hero looks premium — not raw or flat.
- [ ] Blue is clearly dominant across the UI.
- [ ] Green supports but does not compete with blue.
- [ ] Gold/yellow appears sparingly — not scattered everywhere.
- [ ] No major purple/magenta brand color remains (unless kept deliberately as a subtle accent with justification).
- [ ] Dark mode is navy/deep-blue-based, not purple-black.
- [ ] Buttons, links, badges, cards, and active states look consistent across all pages.
- [ ] All dashboards still function — no broken layouts.
- [ ] Public search and booking flow still works end-to-end.
- [ ] Auth/login still works and redirects correctly.
- [ ] Company admin pages still work and remain scoped.
- [ ] No console errors introduced by styling changes.

---

## Future Improvement Suggestions (Post-Refresh)

These are not in scope for the initial refresh — note them for later:

- Create logo variants: compact navbar version, favicon version, large hero version.
- Improve route cards and public landing sections with refined blue/green/gold accent treatments.
- Add code-splitting to reduce the existing Vite chunk size warning (unrelated to brand, but worth scheduling).
- Run a design audit pass specifically for mobile once brand refresh is stable.
- Write a formal brand guide file (`BRAND_GUIDE.md`) with color tokens, typography rules, spacing scale, logo usage rules, and component examples.

---

## How to Resume This Plan

When the user says **"continue the Rugendo Rwanda brand refresh"** or **"let us continue son"**, Claude Code should:

1. Read this file (`BRAND_REFRESH_PLAN.md`) first.
2. Read `TASKS.md` to confirm the brand refresh task is still pending.
3. Start in **Plan mode**.
4. Confirm the list of intended files before touching anything.
5. Ask the user to confirm the palette and logo direction before applying changes.
6. Then implement carefully, following all Implementation Rules above.

---

*Plan saved: 2026-04-29. No implementation done yet.*
