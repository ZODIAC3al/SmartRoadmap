/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        smartlight: {
          primary: "#10B981",
          secondary: "#059669",
          accent: "#34D399",
          neutral: "#0F172A",
          "base-100": "#FAFAFA",
          "base-200": "#FFFFFF",
          "base-300": "#E2E8F0",
          info: "#0EA5E9",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      {
        smartdark: {
          primary: "#10B981",
          secondary: "#34D399",
          accent: "#059669",
          neutral: "#1E293B",
          "base-100": "#0F172A",
          "base-200": "#111827",
          "base-300": "#334155",
          "base-content": "#F1F5F9",
          info: "#38BDF8",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
    ],
    darkTheme: "smartdark",
  },
};
