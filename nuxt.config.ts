// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-09-17',

  modules: [
    '@nuxthub/core',
    '@nuxt/eslint'
  ],

  // 1. VARIABILI D'AMBIENTE SICURE (Server-side)
  // Supporta automaticamente DATABASE_URL, POSTGRES_URL (generati da Neon/Vercel)
  // e il formato nativo NUXT_DATABASE_URL
  runtimeConfig: {
    databaseUrl: 
      process.env.DATABASE_URL || 
      process.env.POSTGRES_URL || 
      process.env.NUXT_DATABASE_URL || 
      '',
    adminSecret: 
      process.env.ADMIN_SECRET || 
      process.env.NUXT_ADMIN_SECRET || 
      ''
  },

  // 2. CONFIGURAZIONE NUXT 4
  future: {
    compatibilityVersion: 4
  },

  // 3. TARGET DI COMPILAZIONE NITRO
  nitro: {
    esnext: true,
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  // 4. OTTIMIZZAZIONE MEMORIA LOCAL DEV (Hardware 12GB RAM)
  devtools: {
    enabled: true,
    vscode: false,
    performance: false, // Disattiva il monitoraggio per evitare memory leak HMR
    timeline: false
  },

  hub: {
    cache: true
  },

  postcss: {
    plugins: {
      'postcss-nesting': {}
    }
  },

  eslint: {
    config: {
      stylistic: {
        quotes: 'single'
      }
    }
  }
})