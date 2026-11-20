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
          bg: '#0f172a',       // slate-950 (Sfondo DKP Pro più luminoso e leggibile)
          card: '#1e293b',     // slate-800 (Card DKP Pro)
          surface: '#162033',  // Superficie intermedia per box interni
          border: '#334155',   // slate-700 (Bordi nitidi)
          muted: '#94a3b8',    // slate-400 (Testo secondario ad alto contrasto)
          text: '#f1f5f9',     // slate-100 (Bianco nitido)
          accent: '#22d3ee',   // cyan-400 (Sentinel Control Accent)
          neon: '#10b981',     // emerald-500 (Verde Neon storico DKP)
          pass: '#10b981',     // emerald-500
          fail: '#ef4444',     // red-500
          warn: '#f59e0b',     // amber-500
          info: '#3b82f6',     // blue-500
          tier1: '#8b5cf6',    // violet-500
          tier2: '#06b6d4',    // cyan-500
          tier3: '#f97316'     // orange-500
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