/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rzp: {
          blue: '#528FF0',
          'blue-dark': '#3A6FD8',
          'blue-light': '#EEF4FE',
          navy: '#1B2733',
          green: '#1CA672',
          'green-light': '#EDFBF5',
          amber: '#E8920D',
          'amber-light': '#FFF8EC',
          red: '#DC3545',
          'red-light': '#FFF0F1',
          gray: {
            50: '#F7F8FA',
            100: '#F0F2F5',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#8C97A4',
            500: '#5F6D7E',
            600: '#455468',
            700: '#1B2733',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        'modal': '0 20px 60px -12px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
