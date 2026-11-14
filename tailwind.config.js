/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1120",
        surface: "#111827",
        surfaceCard: "#162032",
        surfaceBorder: "#1E293B",
        primary: {
          DEFAULT: "#10B981",
          hover: "#059669",
          muted: "#064E3B",
          light: "#34D399",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
          muted: "#164E63",
          light: "#38BDF8",
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          muted: "#78350F",
          light: "#FBBF24",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          muted: "#7F1D1D",
          light: "#F87171",
        },
        foreground: "#F8FAFC",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        cyanGlow: "0 0 25px -5px rgba(6, 182, 212, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))",
      },
    },
  },
  plugins: [],
};
