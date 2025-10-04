import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        airbnb: {
          primary: '#FF5A5F',
          primaryDark: '#E0484D',
          secondary: '#00A699',
          cream: '#FFF1EB',
          creamLight: '#FFF6F1',
          charcoal: '#484848',
        },
      },
      boxShadow: {
        soft: '0 20px 45px -12px rgba(72, 72, 72, 0.2)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        airbnb: {
          primary: '#FF5A5F',
          'primary-content': '#ffffff',
          secondary: '#00A699',
          accent: '#FC642D',
          neutral: '#2F3437',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#F7F7F7',
          'base-300': '#E9EBEE',
          info: '#0099CC',
          success: '#2F9E44',
          warning: '#F59F00',
          error: '#D61F37',
          '--rounded-box': '1.25rem',
          '--rounded-btn': '0.75rem',
          '--animation-btn': '0.25s',
        },
      },
      'light',
    ],
    darkTheme: 'light',
  },
};
