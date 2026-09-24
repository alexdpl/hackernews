// server/api/news.ts
export default defineEventHandler(async (event) => {
  // Lista ricca di notizie di ecosistema DKP (Fallback / Demo)
  const ecosystemStories = [
    {
      id: 101,
      title: 'DevKernelPulse v2.0 Released: Modular SaaS Architecture with Nuxt 3 & GCP',
      domain: 'devkernelpulse.org',
      url: 'https://github.com',
      user: 'alexdpl',
      points: 184,
      time_ago: '2 ore fa',
      comments_count: 32
    },
    {
      id: 102,
      title: 'Open Source eCommerce & Multi-Vendor Marketplace Core with DKP Tools',
      domain: 'github.com',
      url: 'https://github.com',
      user: 'alexdpl',
      points: 156,
      time_ago: '3 ore fa',
      comments_count: 24
    },
    {
      id: 103,
      title: 'How We Optimized Neon PostgreSQL Connection Pooling for Serverless Nuxt SSR',
      domain: 'neon.tech',
      url: 'https://neon.tech',
      user: 'alexdpl',
      points: 129,
      time_ago: '5 ore fa',
      comments_count: 18
    },
    {
      id: 104,
      title: 'DKP Admin Panel: Real-time PM2 Monitoring & Health Check Metrics',
      domain: 'devkernelpulse.org',
      url: '/admin/health',
      user: 'kernel_admin',
      points: 98,
      time_ago: '7 ore fa',
      comments_count: 12
    },
    {
      id: 105,
      title: 'Building High-Performance Nuxt 3 Applications with Rolldown and Vite',
      domain: 'nuxt.com',
      url: 'https://nuxt.com',
      user: 'dev_guru',
      points: 87,
      time_ago: '9 ore fa',
      comments_count: 15
    },
    {
      id: 106,
      title: 'Google Cloud Platform Compute Engine Deployment Best Practices for PM2',
      domain: 'cloud.google.com',
      url: 'https://cloud.google.com',
      user: 'sysadmin',
      points: 74,
      time_ago: '12 ore fa',
      comments_count: 8
    },
    {
      id: 107,
      title: 'DKP Job Board: Remote Senior Full-Stack Vue/Nuxt Developer Openings',
      domain: 'devkernelpulse.org',
      url: '/jobs',
      user: 'alexdpl',
      points: 62,
      time_ago: '1 giorno fa',
      comments_count: 6
    },
    {
      id: 108,
      title: 'TypeScript 5.x Strict Mode Patterns in Modern Fullstack Nuxt Ecosystems',
      domain: 'typescriptlang.org',
      url: 'https://typescriptlang.org',
      user: 'ts_master',
      points: 53,
      time_ago: '1 giorno fa',
      comments_count: 11
    }
  ]

  try {
    // Tenta di usare il DB se disponibile ed esportato correttamente
    // @ts-ignore
    if (typeof db !== 'undefined' && db) {
      // @ts-ignore
      const dbPosts = await db.select().from(posts).limit(30)
      if (dbPosts && dbPosts.length > 0) {
        return dbPosts
      }
    }
  } catch (err) {
    // Se il DB non è configurato o l'istanza manca, usiamo il fallback senza bloccare il server
    console.warn('⚠️ DB non raggiungibile o non definito. Utilizzo notizie di ecosistema DKP.')
  }

  // Restituisce le notizie di ecosistema
  return ecosystemStories
})