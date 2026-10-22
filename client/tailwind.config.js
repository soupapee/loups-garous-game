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
        gothic: {
          950: '#05070d',
          900: '#0b0f19',
          850: '#101726',
          800: '#161f33',
          700: '#23304d',
          600: '#35466e',
          500: '#4f6496',
          400: '#7e93c2',
          300: '#aab9dc',
          200: '#d0daf0',
          100: '#edf2fb'
        },
        wolf: {
          crimson: '#dc2626',
          darkRed: '#7f1d1d',
          blood: '#991b1b',
          silver: '#cbd5e1',
          gold: '#f59e0b',
          moon: '#38bdf8',
          poison: '#a855f7'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fog-slow': 'fogFloat 25s ease-in-out infinite alternate',
        'flicker': 'flicker 2s infinite',
      },
      keyframes: {
        fogFloat: {
          '0%': { transform: 'translateX(-5%) translateY(0)' },
          '100%': { transform: 'translateX(5%) translateY(-10px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
