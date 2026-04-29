/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand — Royal/Cobalt Blue
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',   // primary
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
          600: '#16a34a',   // primary green
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
          500: '#d97706',   // primary gold
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        // Neutral surface tokens
        surface: {
          light:  '#ffffff',
          muted:  '#f0f7ff',
          border: '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient':      'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(37,99,235,0.13) 0%, rgba(29,78,216,0.06) 100%)',
        'hero-gradient':       'linear-gradient(135deg, #071524 0%, #112040 50%, #071524 100%)',
      },
      boxShadow: {
        'brand': '0 4px 24px 0 rgba(37, 99, 235, 0.25)',
        'accent': '0 4px 24px 0 rgba(217, 119, 6, 0.25)',
        'card':   '0 2px 12px 0 rgba(37, 99, 235, 0.08)',
      },
    },
  },
  plugins: [],
};
