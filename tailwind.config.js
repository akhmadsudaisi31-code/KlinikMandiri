/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // PENTING: Mengaktifkan mode gelap berbasis class
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warna utama: Pastel Pink (SaaS Primary)
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        secondary: {
          50:  'rgb(var(--color-secondary-50, 254 252 232) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100, 254 249 195) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200, 254 240 138) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300, 253 224 71) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400, 250 204 21) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500, 234 179 8) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600, 202 138 4) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700, 161 98 7) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800, 133 77 14) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900, 113 63 18) / <alpha-value>)',
          950: 'rgb(var(--color-secondary-950, 66 32 6) / <alpha-value>)',
        },
        accent: {
          400: 'rgb(var(--color-accent-400, 167 139 250) / <alpha-value>)', // default violet
          500: 'rgb(var(--color-accent-500, 139 92 246) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600, 124 58 237) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700, 109 40 217) / <alpha-value>)',
        },
        // Warna latar belakang aplikasi
        surface: '#f8fafc', // Slate-50 (Light Mode)
        // Dark Mode Colors (Slate)
        dark: {
          bg: '#0f172a',       // Slate-900
          surface: '#1e293b',  // Slate-800
          border: '#334155',   // Slate-700
          text: '#f1f5f9',     // Slate-100
          muted: '#94a3b8',    // Slate-400
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'glow': '0 0 15px rgba(var(--glow-color), 0.3)', // Dynamic glow
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}