// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-09-17',

  modules: [
    '@nuxthub/core',
    '@nuxt/eslint'
  ],

  // 1. BRAND, FAVICON SVG & INTESTAZIONI DI SICUREZZA HTTP
  app: {
    head: {
      htmlAttrs: { lang: 'it' },
      title: 'DevKernelPulse - L\'Ecosistema per Sviluppatori in Italia',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Piattaforma tech avanzata, AI Scanner, Terminal mode e bacheca jobs per sviluppatori.' },
        { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
        { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
        { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
      ],
      link: [
        { 
          rel: 'icon', 
          type: 'image/svg+xml', 
          href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300dc82"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' 
        }
      ]
    }
  },

  // 2. VARIABILI D'AMBIENTE SICURE (Server-side)
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

  // 3. CONFIGURAZIONE NUXT 4
  future: {
    compatibilityVersion: 4
  },

  // 4. OTTIMIZZAZIONE COMPILAZIONE NITRO & ROUTE RULES (SSR Caching Sub-100ms)
  nitro: {
    esnext: true,
    compressPublicAssets: true,
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    routeRules: {
      '/': { swr: 60 },                 // Revalidazione SWR ogni 60s
      '/feed': { swr: 30 },             // Revalidazione feed ogni 30s
      '/blog/**': { isr: 3600 },        // Caching statico 1 ora per articoli blog
      '/rss.xml': { swr: 300 },         // Cache 5 min per RSS feed
      '/sitemap.xml': { swr: 3600 },    // Cache 1 ora per Sitemap XML
      '/api/vault/**': { cache: false },// Nessuna cache per le API Vault riservate
      '/user/dashboard': { ssr: false } // SPA Mode per l'Area Riservata Utente
    }
  },

  // 5. DEVTOOLS & PERFORMANCE TUNING
  devtools: {
    enabled: true,
    vscode: false,
    performance: false,
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