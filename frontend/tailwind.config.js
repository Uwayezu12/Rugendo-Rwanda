/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand — deep purple
        brand: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d3c7ff',
          300: '#b89eff',
          400: '#9b72ff',
          500: '#7e48ff',
          600: '#6e26ff',   // primary
          700: '#5a1ae0',
          800: '#4a15b8',
          900: '#3a1190',
          950: '#25097a',
        },
        // Accent — vivid pink/magenta
        accent: {
          50:  '#fff0f9',
          100: '#ffe3f4',
          200: '#ffc7ea',
          300: '#ff9ed8',
          400: '#ff65c1',
          500: '#fa26ae',   // secondary
          600: '#e0188a',
          700: '#bc0f6e',
          800: '#9a0d58',
          900: '#7a0d47',
        },
        // Neutral surface tokens
        surface: {
          light:  '#ffffff',
          muted:  '#f8f7ff',
          border: '#e8e3ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient':  'linear-gradient(135deg, #6e26ff 0%, #fa26ae 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #6e26ff22 0%, #fa26ae22 100%)',
        'hero-gradient':   'linear-gradient(135deg, #1a0845 0%, #2d1080 50%, #1a0845 100%)',
      },
      boxShadow: {
        'brand': '0 4px 24px 0 rgba(110, 38, 255, 0.25)',
        'accent': '0 4px 24px 0 rgba(250, 38, 174, 0.25)',
        'card':   '0 2px 12px 0 rgba(110, 38, 255, 0.08)',
      },
    },
  },
  plugins: [],
};
