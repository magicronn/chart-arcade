/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Chart Arcade brand colors
        arcade: {
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          dark: '#0f172a',
          darker: '#020617',
        }
      },
      animation: {
        'flash-green': 'flashGreen 0.5s ease-out',
        'flash-red': 'flashRed 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgb(34 197 94 / 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgb(239 68 68 / 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
