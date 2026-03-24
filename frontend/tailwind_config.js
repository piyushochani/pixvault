/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          500: "#4f72f5",
          600: "#3b5be0",
          700: "#2d47c7",
        },
      },
    },
  },
  plugins: [],
};