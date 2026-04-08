/** @type {import('tailwindcss').Config} */
module.exports = {
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
