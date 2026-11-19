import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.vue'
  ],
  theme: {
    extend: {
      colors: {
        dkp: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          muted: '#64748b',
          text: '#f1f5f9',
          accent: '#22d3ee',
          pass: '#10b981',
          fail: '#ef4444',
          warn: '#f59e0b',
          info: '#3b82f6',
          tier1: '#8b5cf6',
          tier2: '#06b6d4',
          tier3: '#f97316'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite'
      }
    }
  }
}