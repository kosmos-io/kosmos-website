/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,md,mdx}", './docs/**/*.{js,jsx,ts,tsx,md,mdx}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {},
  },
  plugins: [],
}