/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#10B981',
        'brand-secondary': '#06B6D4',
      },
    },
  },
  plugins: [],
}
