/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './index.tsx',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBF8E6',
          100: '#F5ECBF',
          200: '#EEDF93',
          300: '#E6D166',
          400: '#DEC440',
          500: '#D4AF37', // Gold Base
          600: '#A98C2C',
          700: '#7F6921',
          800: '#554616',
          900: '#2A230B',
          950: '#151205',
        },
        accent: {
          50: '#FDFBF7',
          100: '#FAF6E9',
          200: '#F0EBE0',
          300: '#E6D166',
          400: '#D4AF37',
          500: '#A98C2C',
          600: '#7F6921',
          700: '#554616',
          800: '#2A230B',
          900: '#151205',
          950: '#000000',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
