/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-yellow': '#FFD700',
        'neo-pink': '#FF69B4',
        'neo-cyan': '#00FFFF',
        'neo-lime': '#BFFF00',
        'neo-orange': '#FF8C00',
        'neo-purple': '#DA70D6',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-xl': '12px 12px 0px 0px rgba(0, 0, 0, 1)',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'sans': ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}