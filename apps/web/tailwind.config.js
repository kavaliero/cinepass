/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette utilisée par les statuts (cf. FILM_STATUS_META)
        amber: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        emerald: { 50: '#ecfdf5', 500: '#10b981', 600: '#059669' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
