/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nb-yellow': '#FFD90F',
        'nb-pink': '#FF90E8',
        'nb-cyan': '#22d3ee',
        'nb-lime': '#a3e635',
        'nb-orange': '#fb923c',
        'nb-purple': '#c084fc',
        'nb-white': '#ffffff',
        'nb-gray': '#f3f4f6',
      },
      boxShadow: {
        'nb': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'nb-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'nb-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'nb-active': '1px 1px 0px 0px rgba(0, 0, 0, 1)',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'sans': ['Space Grotesk', 'Arial', 'sans-serif'], // Recommended font for this style
      },
    },
  },
  plugins: [],
}