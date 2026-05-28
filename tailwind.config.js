/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        display: ['var(--font-fredoka)', 'Fredoka', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
