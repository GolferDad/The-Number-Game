/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // scans all your React components
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
}
