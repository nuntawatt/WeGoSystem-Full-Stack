/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
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
      },
      boxShadow: {
        card: '0 12px 28px rgba(0,0,0,.35)',
        'brand-soft': '0 8px 30px rgba(0,0,0,.4)',
        gold: '0 4px 18px rgba(201, 160, 103, .35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
