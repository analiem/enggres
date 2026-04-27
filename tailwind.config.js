/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#1a56db',
          dark: '#5b8dee',
        },
      },
    },
  },
  plugins: [],
}
