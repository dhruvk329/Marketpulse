/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0e0f",
        panel: "#11171a",
        panel2: "#161e22",
        line: "#232e33",
        ash: "#8a9ba0",
        bone: "#e8e6df",
        pos: "#3fd17a",
        neu: "#d6a64a",
        neg: "#e5564e",
      },
      fontFamily: {
        display: ['"Newsreader"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
