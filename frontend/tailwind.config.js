/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1A1A1A",
        foreground: "var(--foreground)",
        primary: {
          light: '#38bdf8',
          DEFAULT: '#0d9488',
          dark: '#0f766e',
        },
        secondary: {
          light: '#F59E0B',
          DEFAULT: '#D97706',
          dark: '#B45309',
        },
      },
    },
  },
  plugins: [],
};
