/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0f14",
          900: "#0f1620",
          850: "#121a26",
          800: "#182230",
          700: "#1f2b3a",
          600: "#2b3a4d",
          500: "#3a4b62",
          400: "#5d6e85",
          300: "#8b9bb1",
          200: "#aebccf",
        },
        accent: {
          DEFAULT: "#3b82f6",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        danger: {
          DEFAULT: "#dc2626",
          soft: "#7f1d1d",
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "2px",
      },
      boxShadow: {
        panel:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
