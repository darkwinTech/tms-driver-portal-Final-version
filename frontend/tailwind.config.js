/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand ramp generated from #ed872d (https://coolors.co/tailwind/ed872d).
        primary: {
          50: '#fdf7f2',
          100: '#faece0',
          200: '#f9d7b9',
          300: '#f5b985',
          400: '#f09c51',
          500: '#ed872d',
          600: '#ef780f',
          700: '#c7640c',
          800: '#9f500a',
          900: '#783c07',
        },
        // Warm-dark sidebar palette, same hue family as `primary` (~22deg)
        // so the menu reads as intentionally related rather than a random gray.
        sidebar: {
          DEFAULT: '#2b1a10',
          hover: '#432819',
          border: '#382215',
        },
      },
    },
  },
  plugins: [],
};
