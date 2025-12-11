/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#0b1530',
        },
        brand: {
          gold: '#C9A067',
          gold2: '#E9CFA6',
          choco: '#2A120A',
        },
        // Gen Z Neon Colors
        neon: {
          pink: '#FF10F0',
          cyan: '#00F5FF',
          lime: '#39FF14',
          orange: '#FF6B35',
          purple: '#BF40BF',
          yellow: '#FFFF00',
          blue: '#4D4DFF',
          green: '#00FF7F',
        },
        // Vibrant gradients base
        genz: {
          purple: '#7C3AED',
          blue: '#2563EB',
          pink: '#EC4899',
          indigo: '#6366F1',
        },
      },
      boxShadow: {
        card: '0 12px 28px rgba(0,0,0,.35)',
        'brand-soft': '0 8px 30px rgba(0,0,0,.4)',
        gold: '0 4px 18px rgba(201, 160, 103, .35)',
        // Neon glow shadows
        'neon-pink': '0 0 20px rgba(255, 16, 240, 0.5), 0 0 40px rgba(255, 16, 240, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.3)',
        'neon-lime': '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3)',
        'neon-purple': '0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'genz-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'neon-gradient': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #06B6D4 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.5), 0 0 10px rgba(124, 58, 237, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.8), 0 0 40px rgba(124, 58, 237, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      ring: {
        DEFAULT: '1px solid',
      },
      ringColor: ({ theme }) => ({
        white: 'rgb(255 255 255)',
        ...Object.entries(theme('opacity')).reduce((acc, [key, value]) => {
          acc[`white/${key}`] = `rgb(255 255 255 / ${value})`;
          return acc;
        }, {})
      }),
      backgroundColor: {
        'white/5': 'rgb(255 255 255 / 0.05)',
        'white/10': 'rgb(255 255 255 / 0.1)',
        'white/15': 'rgb(255 255 255 / 0.15)',
      },
      textColor: {
        'white/50': 'rgb(255 255 255 / 0.5)',
        'white/70': 'rgb(255 255 255 / 0.7)',
        'white/80': 'rgb(255 255 255 / 0.8)',
        'white/90': 'rgb(255 255 255 / 0.9)',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const ringUtilities = {
        '.ring-white\\/15': {
          '--tw-ring-color': 'rgb(255 255 255 / 0.15)',
        },
        '.ring-white\\/10': {
          '--tw-ring-color': 'rgb(255 255 255 / 0.10)',
        },
      };
      addUtilities(ringUtilities);
    }
  ],
};
