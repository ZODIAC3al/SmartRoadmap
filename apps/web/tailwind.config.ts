/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        smartlight: {
          primary: '#004b49',
          secondary: '#00875a',
          accent: '#818cf8',
          neutral: '#1a2e2c',
          'base-100': '#fbfaf7',
          'base-200': '#f4f3ee',
          'base-300': '#e2dfd5',
          info: '#3b5bfd',
          success: '#00875a',
          warning: '#eab308',
          error: '#ef4444',
        },
      },
      {
        smartdark: {
          primary: '#10b981',
          secondary: '#34d399',
          accent: '#818cf8',
          neutral: '#111e1c',
          'base-100': '#0d1514',
          'base-200': '#13201e',
          'base-300': '#1d322f',
          'base-content': '#e2e8f0',
          info: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
    darkTheme: 'smartdark',
  },
};