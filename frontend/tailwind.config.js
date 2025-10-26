/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        secondary: '#14b8a6',
        neutral: {
          50: '#f8fafc',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
