/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffc8b8',
          300: '#ffaa8a',
          400: '#ff8860',
          500: '#ff6640',
          600: '#e8512e',
          700: '#c43d1e',
        }
      },
    },
  },
  plugins: [],
}
