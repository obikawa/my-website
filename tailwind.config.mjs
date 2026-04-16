/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef1f8',
          100: '#dde4f0',
          200: '#b8c9e3',
          300: '#8ea8d2',
          400: '#6285bf',
          500: '#3d62a8',
          600: '#2b4d8e',
          700: '#1e3970',
          800: '#142959',
          900: '#0d1c40',
        },
        accent: {
          50:  '#fdf9ef',
          100: '#faefda',
          200: '#f5dda6',
          300: '#edc76c',
          400: '#e4b03d',
          500: '#c99030',
          600: '#a77428',
          700: '#81581f',
          800: '#5d3e16',
        },
        warm: {
          50:  '#faf8f4',
          100: '#f3ede4',
          200: '#e7ddd2',
          300: '#d6c8b8',
        },
      },
      fontFamily: {
        sans:    ['"Noto Sans JP"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
