/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        accent: '#FF6F00',
        danger: '#D32F2F',
        surface: '#F5F5F5',
        'surface-2': '#EEEEEE',
        border: '#D8D8D8',
      },
      borderRadius: {
        pill: '24px',
      },
    },
  },
  plugins: [],
}
