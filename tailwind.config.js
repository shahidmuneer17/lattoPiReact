/** @type {import('tailwindcss').Config} */
module.exports = {
  // Class-based dark mode so we can drive it from a Theme provider that
  // toggles `dark` on the <html> element. Without this Tailwind defaults to
  // `media` (system preference) and our toggle would do nothing.
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        pi: { gold: '#f5c518', purple: '#7c3aed' },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
