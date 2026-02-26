/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#05060A',
        secondary: '#0A0D12',
        accent: '#B7FF2A',
        accent2: '#00E5FF',
        accent3: '#FF2EDC',
        ink: '#0B0D10',
        surface: '#101621',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Urbanist', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Bebas Neue', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
