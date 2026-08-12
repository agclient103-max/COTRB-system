/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // COTRB brand palette — deep vestry blue + warm brass accent,
        // chosen to read as "parish administration," not a generic SaaS template.
        ink: {
          50: '#f1f4f9',
          100: '#dde4ef',
          200: '#b9c7dc',
          300: '#8fa3c2',
          400: '#5c789f',
          500: '#3d5980',
          600: '#2c4363',
          700: '#22344d',
          800: '#1a2739',
          900: '#141d2b',
          950: '#0c111a',
        },
        brass: {
          50: '#fbf6ec',
          100: '#f4e8cb',
          200: '#e8cd93',
          300: '#dcb266',
          400: '#cf9a42',
          500: '#b7822f',
          600: '#946526',
          700: '#734c1f',
          800: '#553a1c',
          900: '#3c2913',
        },
        canvas: '#f7f5f0',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
