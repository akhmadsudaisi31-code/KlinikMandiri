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
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // Main Pink
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        // Warna sekunder: Pastel Yellow (SaaS Accent)
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308', // Main Yellow
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
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
        'glow': '0 0 15px rgba(236, 72, 153, 0.3)', // Pastel Pink glow
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}