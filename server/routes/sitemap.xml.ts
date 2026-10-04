// server/routes/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  // 1. Imposta l'header della risposta come XML
  setHeader(event, 'content-type', 'text/xml; charset=utf-8')

  const baseUrl = 'https://devkernelpulse.org'
  const currentDate = new Date().toISOString()

  // 2. Rotte statiche dell'Ecosistema DKP v2.4-GOLD
  const staticRoutes = [
    '',
    '/about',
    '/ask',
    '/contact',
    '/features',
    '/guidelines',
    '/jobs',
    '/login',
    '/newest',
    '/news',
    '/roadmap',
    '/show',
    '/status',
    '/submit',
    '/docs/api',
    '/docs/ecosystem',
    '/docs/sdk',
    '/legal/cookies',
    '/legal/privacy',
    '/legal/terms',
    '/shop',
    '/shop/success',
    '/tools',
    '/tools/ai-repo-scanner',
    '/tools/ai-scanner',
    '/tools/cli-toolkit',
    '/tools/neural-playground',
    '/tools/proof-of-code',
    '/tools/terminal'
  ]

  // Array contenitore per tutte le entrate
  let allUrls: { url: string; lastmod: string; priority: string; changefreq: string }[] = []

  // Aggiungi rotte statiche
  staticRoutes.forEach((route) => {
    let priority = '0.8'
    if (route === '') priority = '1.0'
    else if (route.startsWith('/tools') || route.startsWith('/shop')) priority = '0.9'

    allUrls.push({
      url: `${baseUrl}${route}`,
      lastmod: currentDate,
      priority,
      changefreq: 'daily'
    })
  })

  // 3. FETCH DINAMICO: Articoli Blog
  try {
    const blogRes: any = await $fetch('/api/blog/posts').catch(() => null)
    const posts = blogRes?.posts || blogRes || []
    if (Array.isArray(posts)) {
      posts.forEach((post: any) => {
        const slug = post.slug || post.id
        if (slug) {
          allUrls.push({
            url: `${baseUrl}/blog/${slug}`,
            lastmod: post.updatedAt || post.createdAt || currentDate,
            priority: '0.8',
            changefreq: 'weekly'
          })
        }
      })
    }
  } catch (err) {
    // Fallback silente per non bloccare la generazione della sitemap
  }

  // 4. FETCH DINAMICO: Offerte di Lavoro (Jobs)
  try {
    const jobsRes: any = await $fetch('/api/jobs').catch(() => null)
    const jobs = jobsRes?.jobs || jobsRes || []
    if (Array.isArray(jobs)) {
      jobs.forEach((job: any) => {
        if (job.id && job.isActive !== false) {
          allUrls.push({
            url: `${baseUrl}/jobs/${job.id}`,
            lastmod: job.updatedAt || currentDate,
            priority: '0.7',
            changefreq: 'daily'
          })
        }
      })
    }
  } catch (err) {
    // Fallback silente
  }

  // 5. FETCH DINAMICO: Prodotti Shop SaaS
  try {
    const shopRes: any = await $fetch('/api/shop/products').catch(() => null)
    const products = shopRes?.products || shopRes || []
    if (Array.isArray(products)) {
      products.forEach((product: any) => {
        const slug = product.slug || product.id
        if (slug) {
          allUrls.push({
            url: `${baseUrl}/shop/${slug}`,
            lastmod: currentDate,
            priority: '0.8',
            changefreq: 'weekly'
          })
        }
      })
    }
  } catch (err) {
    // Fallback silente
  }

  // 6. Generazione del markup XML
  const xmlEntries = allUrls
    .map(
      (item) => `
    <url>
      <loc>${item.url}</loc>
      <lastmod>${item.lastmod}</lastmod>
      <changefreq>${item.changefreq}</changefreq>
      <priority>${item.priority}</priority>
    </url>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`
})