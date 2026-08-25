/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="smartdark"]'],
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
      colors: {
        "brand-beige": "#F8EEDF",
        "brand-sand": "#E8C999",
        "brand-sand-dark": "#D6B480",
        "brand-red": "#8E1616",
        "brand-red-hover": "#701111",
        "brand-red-light": "#A82222",
        "brand-dark-100": "#121212",
        "brand-dark-200": "#151515",
        "brand-dark-300": "#1A1A1A",
        "brand-dark-400": "#222222",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        smartlight: {
          primary: "#8E1616",
          "primary-content": "#FFFFFF",
          secondary: "#E8C999",
          "secondary-content": "#111827",
          accent: "#8E1616",
          neutral: "#111827",
          "neutral-content": "#F8EEDF",
          "base-100": "#F8EEDF",
          "base-200": "#FAF3EA",
          "base-300": "#E8C999",
          "base-content": "#111827",
          info: "#2563EB",
          success: "#16A34A",
          warning: "#D97706",
          error: "#8E1616",
        },
      },
      {
        smartdark: {
          primary: "#8E1616",
          "primary-content": "#FFFFFF",
          secondary: "#E8C999",
          "secondary-content": "#121212",
          accent: "#E8C999",
          neutral: "#1A1A1A",
          "neutral-content": "#F5EBE1",
          "base-100": "#121212",
          "base-200": "#151515",
          "base-300": "#1F1F1F",
          "base-content": "#F5EBE1",
          info: "#38BDF8",
          success: "#22C55E",
          warning: "#E8C999",
          error: "#EF4444",
        },
      },
    ],
    darkTheme: "smartdark",
  },
};
