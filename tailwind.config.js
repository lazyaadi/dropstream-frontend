/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50:  "#F4F5F7",
          100: "#E7E9ED",
          200: "#CBCFD8",
          300: "#9CA3B0",
          400: "#8A90A0",
          500: "#6C7387",
          600: "#565C6E",
          700: "#232733",
          800: "#171A22",
          900: "#12141B",
          950: "#0B0D12",
        },
      },
    },
  },
  plugins: [],
}