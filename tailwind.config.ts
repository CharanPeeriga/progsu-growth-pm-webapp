import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        base: "var(--ink-950)",
        sidebar: "var(--ink-900)",
        surface: "var(--ink-850)",
        elevated: "var(--ink-800)",
        popover2: "var(--ink-750)",
        hoverfill: "var(--ink-700)",
        ink: {
          950: "var(--ink-950)", 900: "var(--ink-900)", 850: "var(--ink-850)",
          800: "var(--ink-800)", 750: "var(--ink-750)", 700: "var(--ink-700)",
          600: "var(--ink-600)", 500: "var(--ink-500)", 400: "var(--ink-400)",
          300: "var(--ink-300)", 200: "var(--ink-200)", 100: "var(--ink-100)",
          50:  "var(--ink-050)",
        },
        primaryText: "var(--text-primary)",
        secondaryText: "var(--text-secondary)",
        mutedText: "var(--text-muted)",
        accent2: {
          200: "var(--accent-200)", 300: "var(--accent-300)", 400: "var(--accent-400)",
          500: "var(--accent-500)", 600: "var(--accent-600)", 700: "var(--accent-700)",
        },
        team: {
          growth: "var(--team-growth)",
          tech: "var(--team-tech)",
          operations: "var(--team-operations)",
          progirls: "var(--team-progirls)",
        },
        status: {
          todo: "var(--status-todo)",
          progress: "var(--status-progress)",
          review: "var(--status-review)",
          done: "var(--status-done)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        chip: "8px",
        control: "10px",
        card: "14px",
        modal: "18px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        cardHover: "var(--shadow-card-hover)",
        glow: "var(--shadow-glow)",
        popover: "var(--shadow-popover)",
        btn: "var(--shadow-btn)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      maxWidth: {
        shell: "1400px",
      },
    },
  },
  plugins: [],
};
export default config;
