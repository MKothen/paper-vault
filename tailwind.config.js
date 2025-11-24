/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional muted palette for scientific tools
        'nb-slate': '#64748b',      // Primary accent - muted blue-gray
        'nb-stone': '#78716c',      // Secondary - warm gray
        'nb-zinc': '#71717a',       // Tertiary - cool gray
        'nb-neutral': '#737373',    // Neutral gray
        'nb-teal': '#5f9ea0',       // Muted teal for highlights
        'nb-amber': '#d4a574',      // Soft amber for important items
        'nb-white': '#ffffff',
        'nb-gray': '#f5f5f4',       // Softer background
        'nb-darkgray': '#44403c',   // Dark text
      },
      boxShadow: {
        'nb': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'nb-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'nb-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'nb-active': '1px 1px 0px 0px rgba(0, 0, 0, 1)',
        'nb-hover': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'sans': ['Space Grotesk', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}