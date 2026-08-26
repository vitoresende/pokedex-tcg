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
        pokedex: {
          red: '#DC0A2D',
          darkred: '#89061C',
          lightred: '#FF1C44',
          blue: '#28AAFD',
          cyan: '#00F0FF',
          yellow: '#FFDE00',
          green: '#51AC51',
          dark: '#1B1E2B',
          darker: '#11131B',
          screen: '#232936',
          screenlight: '#2E3547',
          border: '#3A4259',
          card: '#1F2432',
          gold: '#FFD700',
        },
        type: {
          grass: '#78C850',
          fire: '#F08030',
          water: '#6890F0',
          lightning: '#F8D030',
          psychic: '#F85888',
          fighting: '#C03028',
          darkness: '#705848',
          metal: '#B8B8D0',
          fairy: '#EE99AC',
          dragon: '#7038F8',
          colorless: '#A8A878',
          trainer: '#14B8A6',
          energy: '#F59E0B',
        }
      },
      boxShadow: {
        'pokedex-glow': '0 0 15px rgba(40, 170, 253, 0.6), 0 0 30px rgba(40, 170, 253, 0.3)',
        'pokedex-red': '0 0 15px rgba(220, 10, 45, 0.5)',
        'pokedex-screen': 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
        'holo': '0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'holo-shimmer': 'holo 4s ease infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        holo: {
          '0%, 100%': { opacity: '0.4', transform: 'rotate(0deg)' },
          '50%': { opacity: '0.8', transform: 'rotate(180deg)' },
        }
      }
    },
  },
  plugins: [],
}
