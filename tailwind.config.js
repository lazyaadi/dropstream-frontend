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
        blue: {
          50:  "#EEF2FC",
          100: "#DCE5F8",
          200: "#B9CBF2",
          300: "#96B2EB",
          400: "#8AA3ED",
          500: "#6E9BF4",
          600: "#5A82D6",
          700: "#4A6BB3",
          800: "#3B5490",
          900: "#2C3D6D",
          950: "#1C2747",
        },
      },
    },
  },
  plugins: [],
}