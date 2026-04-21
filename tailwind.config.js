/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito_400Regular'],
        medium: ['Nunito_600SemiBold'],
        bold: ['Nunito_700Bold'],
        display: ['Fraunces_600SemiBold'],
        displayBold: ['Fraunces_700Bold'],
        hand: ['Caveat_500Medium'],
        handBold: ['Caveat_700Bold'],
      },
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          soft: 'rgb(var(--color-bg-soft) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          dim: 'rgb(var(--color-ink-dim) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
        },
        period: 'rgb(var(--color-accent) / <alpha-value>)',
        fertile: '#7eb8da',
        ovulation: '#9b6bd8',
      },
      borderRadius: {
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
