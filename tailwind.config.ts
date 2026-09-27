import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1B18',
        paper: '#FBF8F3',
        paprika: '#C4501C',
        paprika_dark: '#9B3D14',
        sage: '#5B6B4D',
        line: '#E4DDD0'
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      },
      borderRadius: {
        card: '14px'
      }
    }
  },
  plugins: []
}
export default config
