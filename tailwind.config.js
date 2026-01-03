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
        // Warna utama: Emerald (Hijau Medis Modern)
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}