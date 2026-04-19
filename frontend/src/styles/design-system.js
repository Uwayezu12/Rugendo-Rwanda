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
  brand: {
    50:  '#f3f0ff',
    100: '#e9e3ff',
    200: '#d3c7ff',
    300: '#b89eff',
    400: '#9b72ff',
    500: '#7e48ff',
    600: '#6e26ff',   // PRIMARY — use for main CTAs, links, active states
    700: '#5a1ae0',
    800: '#4a15b8',
    900: '#3a1190',
    950: '#25097a',
  },
  accent: {
    50:  '#fff0f9',
    100: '#ffe3f4',
    200: '#ffc7ea',
    300: '#ff9ed8',
    400: '#ff65c1',
    500: '#fa26ae',   // SECONDARY — use for highlights, badges, gradient endpoints
    600: '#e0188a',
    700: '#bc0f6e',
    800: '#9a0d58',
    900: '#7a0d47',
  },
};

// ── Semantic color roles ───────────────────────────────────────────────────────
export const semantic = {
  success: {
    bg:   '#ecfdf5',
    text: '#065f46',
    border:'#6ee7b7',
  },
  warning: {
    bg:   '#fffbeb',
    text: '#92400e',
    border:'#fcd34d',
  },
  error: {
    bg:   '#fef2f2',
    text: '#991b1b',
    border:'#fca5a5',
  },
  info: {
    bg:   '#eff6ff',
    text: '#1e40af',
    border:'#93c5fd',
  },
};

// ── Surface / background tokens ───────────────────────────────────────────────
export const surfaces = {
  light: {
    pageBackground:    '#ffffff',
    mutedBackground:   '#f8f7ff',   // Slightly purple-tinted off-white for alternating sections
    cardBackground:    '#ffffff',
    cardBorder:        '#e8e3ff',
    inputBackground:   '#ffffff',
    inputBorder:       '#e8e3ff',
    navBackground:     '#ffffff',
    footerBackground:  '#0e0a1f',
  },
  dark: {
    pageBackground:    '#0e0a1f',   // Deep near-black with purple tint
    mutedBackground:   '#130d2e',   // Slightly lighter for alternating sections
    cardBackground:    '#1a1035',   // Card surfaces in dark mode
    cardBorder:        '#2d1a5e',
    inputBackground:   '#1a1035',
    inputBorder:       '#2d1a5e',
    navBackground:     '#0e0a1f',
    footerBackground:  '#080516',
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
  brand:     'linear-gradient(135deg, #6e26ff 0%, #fa26ae 100%)',
  brandSoft: 'linear-gradient(135deg, rgba(110,38,255,0.13) 0%, rgba(250,38,174,0.13) 100%)',
  hero:      'linear-gradient(135deg, #1a0845 0%, #2d1080 50%, #1a0845 100%)',
  heroText:  'linear-gradient(90deg, #9b72ff 0%, #fa26ae 100%)',
  card:      'linear-gradient(135deg, #1a1035 0%, #2d1080 100%)',
};

// ── Spacing / layout ──────────────────────────────────────────────────────────
export const spacing = {
  sectionPaddingY: '4rem',     // py-16
  cardPadding:     '1.5rem',   // p-6
  containerMaxW:   '80rem',    // max-w-7xl
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadows = {
  brand:  '0 4px 24px 0 rgba(110, 38, 255, 0.25)',
  accent: '0 4px 24px 0 rgba(250, 38, 174, 0.25)',
  card:   '0 2px 12px 0 rgba(110, 38, 255, 0.08)',
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
 * Buttons
 *   btn-primary   → solid brand-600 fill. Use for primary CTA actions.
 *   btn-gradient  → brand→accent gradient. Use for hero CTA, featured actions.
 *   btn-accent    → solid accent-500 fill. Use sparingly for secondary emphasis.
 *   btn-secondary → outlined brand variant. Use for secondary actions beside a primary.
 *   btn-ghost     → transparent with hover. Use in navbars and inline actions.
 *
 * Cards
 *   card          → standard white/dark surface with shadow-card and border.
 *   card-hover    → card + hover lift + brand shadow. Use for clickable route/trip cards.
 *   card-gradient → soft brand-gradient background. Use for feature highlight sections.
 *
 * Sections / page backgrounds
 *   white / dark bg-[#0e0a1f]   → default page background
 *   section-muted (#f8f7ff / #130d2e) → alternate sections for visual rhythm
 *   hero section: use bg-hero-gradient (dark purple) always, even in light mode.
 *
 * Brand gradient usage
 *   Use on: hero backgrounds, large CTA banners, section dividers, gradient text headings.
 *   Avoid: body text, small labels, table rows — restraint makes it impactful.
 *
 * Color hierarchy
 *   brand-600  (#6e26ff) — primary actions, links, active nav, selected states
 *   accent-500 (#fa26ae) — highlights, badges, "new" / "popular" labels, gradient accent
 *   emerald    — confirmed / success states
 *   amber      — pending / warning states
 *   red        — error / cancelled states
 */
export const guidance = {
  buttons: {
    primaryAction:   'btn-primary',
    heroCTA:         'btn-gradient',
    secondaryAction: 'btn-secondary',
    ghostAction:     'btn-ghost',
  },
  cards: {
    standard:    'card',
    interactive: 'card-hover',
    feature:     'card-gradient',
  },
  sectionBg: {
    default: 'bg-white dark:bg-[#0e0a1f]',
    muted:   'bg-[#f8f7ff] dark:bg-[#130d2e]',
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
