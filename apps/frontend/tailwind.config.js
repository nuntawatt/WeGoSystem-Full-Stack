/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // WegoSystem Primary Color System
        teal: {
          50: '#F0F9F8',
          100: '#E0F3F1',
          200: '#BFE7E2',
          300: '#94D7CF',
          400: '#4ABAA9',
          500: '#147D70', // Deep Teal Primary
          600: '#11665C', // Dark Teal
          700: '#0E524A',
          800: '#0B3E38',
          900: '#082E29',
        },
        primary: {
          50: '#F0F9F8',
          100: '#E0F3F1',
          200: '#BFE7E2',
          300: '#94D7CF',
          400: '#4ABAA9',
          500: '#147D70',
          600: '#11665C',
          700: '#0E524A',
          800: '#0B3E38',
          900: '#082E29',
        },
        'wego-teal': {
          DEFAULT: '#147D70',
          dark: '#11665C',
          light: '#E0F3F1',
          50: '#F0F9F8',
          100: '#E0F3F1',
          200: '#BFE7E2',
          300: '#94D7CF',
          400: '#4ABAA9',
          500: '#147D70',
          600: '#11665C',
          700: '#0E524A',
          800: '#0B3E38',
          900: '#082E29',
        },
        // WegoSystem Secondary Color System
        lime: {
          50: '#FAFEE6',
          100: '#F5FCCF',
          200: '#EAF5D5', // Soft Green
          300: '#D9F36A', // Lime Green Accent
          400: '#C5E349',
          500: '#A9C726',
          600: '#8A9E19',
          700: '#6B7A14',
          800: '#4D5810',
          900: '#333A0C',
        },
        'wego-lime': {
          DEFAULT: '#D9F36A',
          soft: '#EAF5D5',
          light: '#F5FCCF',
          dark: '#C5E349',
        },
        // WegoSystem Neutrals
        neutral: {
          bg: '#F3F5F4',
          surface: '#FFFFFF',
          sidebar: '#202124',
          'primary-text': '#202124',
          'secondary-text': '#858B89',
          border: '#E8EBE9',
        },
        slate: {
          50: '#F3F5F4', // mapped to brand background
          100: '#E8EBE9', // mapped to brand border
          200: '#DDE2DF',
          300: '#BAC2BF',
          400: '#858B89', // mapped to brand secondary text
          500: '#5F6664',
          600: '#424846',
          700: '#2E3332',
          800: '#202124', // mapped to brand sidebar / primary text
          900: '#17181A',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px rgba(20, 125, 112, 0.08)',
        teal: '0 4px 14px 0 rgba(20, 125, 112, 0.25)',
        lime: '0 4px 14px 0 rgba(217, 243, 106, 0.35)',
      },
      borderRadius: {
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
        '3xl': '1.25rem', // 20px
        '4xl': '1.5rem', // 24px
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
