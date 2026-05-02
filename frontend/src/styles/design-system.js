/**
 * Rugendo Rwanda — Design System Tokens
 *
 * Single source of truth for the visual language.
 * Mirrors values in tailwind.config.js and index.css.
 * Import and use in components that need programmatic access to tokens
 * (e.g. chart theming, inline style exceptions, Canvas rendering).
 *
 * For standard UI: use the Tailwind classes defined in index.css and tailwind.config.js.
 */

// ── Brand colors ──────────────────────────────────────────────────────────────
export const colors = {
  // Primary — Royal/Cobalt Blue
  brand: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',   // PRIMARY — use for main CTAs, links, active states
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  // Supporting — Forest Green
  green: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',   // PRIMARY GREEN — success, secondary CTAs, supporting accents
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  // Accent — Warm Gold (use sparingly)
  accent: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#d97706',   // PRIMARY GOLD — highlights, badges, premium accents only
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },
};

// ── Semantic color roles ───────────────────────────────────────────────────────
export const semantic = {
  success: {
    bg:    '#ecfdf5',
    text:  '#065f46',
    border:'#6ee7b7',
  },
  warning: {
    bg:    '#fffbeb',
    text:  '#92400e',
    border:'#fcd34d',
  },
  error: {
    bg:    '#fef2f2',
    text:  '#991b1b',
    border:'#fca5a5',
  },
  info: {
    bg:    '#eff6ff',
    text:  '#1e40af',
    border:'#93c5fd',
  },
};

// ── Surface / background tokens ───────────────────────────────────────────────
export const surfaces = {
  light: {
    pageBackground:   '#ffffff',
    mutedBackground:  '#f0f7ff',   // Ice-blue tinted off-white for alternating sections
    cardBackground:   '#ffffff',
    cardBorder:       '#dbeafe',
    inputBackground:  '#ffffff',
    inputBorder:      '#dbeafe',
    navBackground:    '#ffffff',
    footerBackground: '#071524',
  },
  dark: {
    pageBackground:   '#071524',   // Deep navy
    mutedBackground:  '#0d1f3c',   // Slightly lighter navy for alternating sections
    cardBackground:   '#112040',   // Card surfaces in dark mode
    cardBorder:       '#1e3a5f',
    inputBackground:  '#112040',
    inputBorder:      '#1e3a5f',
    navBackground:    '#071524',
    footerBackground: '#040e1a',
  },
};

// ── Typography ────────────────────────────────────────────────────────────────
export const typography = {
  fontFamily: 'Inter, sans-serif',
  sizes: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
    '4xl':'2.25rem',   // 36px
    '5xl':'3rem',      // 48px
    '6xl':'3.75rem',   // 60px
  },
  weights: {
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },
};

// ── Gradients ─────────────────────────────────────────────────────────────────
export const gradients = {
  brand:     'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  brandSoft: 'linear-gradient(135deg, rgba(37,99,235,0.13) 0%, rgba(29,78,216,0.06) 100%)',
  hero:      'linear-gradient(135deg, #071524 0%, #112040 50%, #071524 100%)',
  heroText:  'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
  card:      'linear-gradient(135deg, #112040 0%, #1e3a5f 100%)',
};

// ── Spacing / layout ──────────────────────────────────────────────────────────
export const spacing = {
  sectionPaddingY: '4rem',     // py-16
  cardPadding:     '1.5rem',   // p-6
  containerMaxW:   '80rem',    // max-w-7xl
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadows = {
  brand:  '0 4px 24px 0 rgba(37, 99, 235, 0.25)',
  accent: '0 4px 24px 0 rgba(217, 119, 6, 0.25)',
  card:   '0 2px 12px 0 rgba(37, 99, 235, 0.08)',
  sm:     '0 1px 4px 0 rgba(0,0,0,0.08)',
};

// ── Border radius ─────────────────────────────────────────────────────────────
export const radii = {
  sm:   '0.5rem',    // rounded-lg — inputs, small badges
  md:   '0.75rem',   // rounded-xl — buttons, cards
  lg:   '1rem',      // rounded-2xl — larger cards, modals
  full: '9999px',    // rounded-full — pill badges, avatars
};

// ── Component style guidance ──────────────────────────────────────────────────
/**
 * Color hierarchy
 *   brand-600  (#2563eb) — primary actions, links, active nav, selected states — BLUE DOMINATES
 *   green-600  (#16a34a) — success states, secondary CTAs, supporting badge accents
 *   accent-500 (#d97706) — highlights, "popular" labels, premium badges — USE SPARINGLY
 *   emerald    — confirmed / success states
 *   amber      — pending / warning states
 *   red        — error / cancelled states
 *
 * Buttons
 *   btn-primary   → solid brand-600 fill. Use for primary CTA actions.
 *   btn-gradient  → brand blue gradient. Use for hero CTA, featured actions.
 *   btn-accent    → solid accent-500 fill (gold). Use sparingly for special emphasis.
 *   btn-secondary → outlined brand variant. Use for secondary actions beside a primary.
 *   btn-ghost     → transparent with hover. Use in navbars and inline actions.
 *
 * Cards
 *   card          → standard white/dark surface with shadow-card and border.
 *   card-hover    → card + hover lift + brand shadow. Use for clickable route/trip cards.
 *   card-gradient → soft brand-gradient background. Use for feature highlight sections.
 *
 * Sections / page backgrounds
 *   white / dark bg-[#071524]  → default page background
 *   section-muted (#f0f7ff / #0d1f3c) → alternate sections for visual rhythm
 *   hero section: use bg-hero-gradient (dark navy) always, even in light mode.
 *
 * Brand gradient usage
 *   Use on: hero backgrounds, large CTA banners, section dividers, gradient text headings.
 *   Avoid: body text, small labels, table rows — restraint makes it impactful.
 */
export const guidance = {
  buttons: {
    primaryAction:   'btn-primary',
    heroCTA:         'btn-gradient',
    positiveAction:  'btn-green',
    secondaryAction: 'btn-secondary',
    ghostAction:     'btn-ghost',
  },
  cards: {
    standard:    'card',
    interactive: 'card-hover',
    feature:     'card-gradient',
  },
  sectionBg: {
    default: 'bg-white dark:bg-[#071524]',
    muted:   'bg-[#f0f7ff] dark:bg-[#0d1f3c]',
    hero:    'bg-hero-gradient',
  },
};

export default {
  colors,
  semantic,
  surfaces,
  typography,
  gradients,
  spacing,
  shadows,
  radii,
  guidance,
};
