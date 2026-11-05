/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf9f1',
          100: '#f6f1dc',
          200: '#ede1b5',
          300: '#e1cb84',
          400: '#d5b353',
          500: '#c59d33',
          600: '#ab8027',
          700: '#896122',
          800: '#714e21',
          900: '#5f4120',
        },
      },
    },
  },
  plugins: [],
};

