/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /**
         * Semantic tokens — đổi theo theme.
         * Sử dụng CSS variables định nghĩa trong :root (light) và .dark (dark).
         * Tailwind sẽ sinh ra class `bg-bg`, `text-text`, `border-border`...
         */
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        'bg-raised': 'var(--bg-raised)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-soft': 'var(--text-soft)',
        'text-muted': 'var(--text-muted)',
        'text-inverted': 'var(--text-inverted)',

        // Accent (giữ 1 brand duy nhất, nhưng map primary qua biến cho dễ tinh chỉnh)
        accent: {
          DEFAULT: 'var(--accent)',
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          800: 'var(--accent-800)',
          900: 'var(--accent-900)',
        },

        // Danger — giữ cố định để đảm bảo nghĩa "nguy hiểm" không đổi giữa 2 theme
        danger: {
          DEFAULT: '#dc2626',
          soft: '#7f1d1d',
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
        panel: 'var(--shadow-panel)',
      },
    },
  },
  plugins: [],
};