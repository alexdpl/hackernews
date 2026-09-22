// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-09-17',

  modules: [
    '@nuxthub/core',
    '@nuxt/eslint'
  ],

  // 1. BRAND & SEO METADATA (Favicon SVG vettoriale integrata & SEO)
  app: {
    head: {
      title: 'DevKernelPulse - L\'Ecosistema per Sviluppatori in Italia',
      meta: [
        { name: 'description', content: 'Piattaforma tech avanzata, AI Scanner, Terminal mode e bacheca jobs per sviluppatori.' }
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

  // 4. TARGET DI COMPILAZIONE NITRO
  nitro: {
    esnext: true,
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  // 5. OTTIMIZZAZIONE MEMORIA LOCAL DEV
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