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
        // Warna utama: Teal / Cyan (Pharmaceutical Modern)
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Main Teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
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
        'glow': '0 0 15px rgba(20, 184, 166, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}