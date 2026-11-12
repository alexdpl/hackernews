// server/routes/sitemap.xml.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const baseUrl = 'https://devkernelpulse.org'
  const sql = usePureSql()

  const staticPages = [
    '',
    '/news',
    '/nodes',
    '/shop',
    '/bounties',
    '/tools',
    '/tools/terminal',
    '/tools/openui-studio',
    '/tools/cli-toolkit',
    '/tools/proof-of-code',
    '/tools/ai-scanner',
    '/tools/ai-repo-scanner'
  ]

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

  // 1. Pagine Statiche Root
  staticPages.forEach((route) => {
    xml += `  <url>\n`
    xml += `    <loc>${baseUrl}${route}</loc>\n`
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`
    xml += `    <changefreq>${route === '' ? 'daily' : 'weekly'}</changefreq>\n`
    xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`
    xml += `  </url>\n`
  })

  // 2. Articoli Dinamici Blog (Recuperati da Neon Pure SQL)
  try {
    const postsData: any = await sql`
      SELECT slug, updated_at, created_at 
      FROM blog_posts 
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 1000
    `
    const dynamicPosts = Array.isArray(postsData) ? postsData : (postsData.rows || [])

    dynamicPosts.forEach((post) => {
      const lastModDate = post.updated_at || post.created_at || new Date()
      xml += `  <url>\n`
      xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`
      xml += `    <lastmod>${new Date(lastModDate).toISOString()}</lastmod>\n`
      xml += `    <changefreq>monthly</changefreq>\n`
      xml += `    <priority>0.7</priority>\n`
      xml += `  </url>\n`
    })
  } catch (err) {
    console.error('❌ [SITEMAP DB ERROR]: Impossibile estrarre i post:', err)
  }

  xml += `</urlset>`

  event.node.res.setHeader('Content-Type', 'text/xml')
  return xml
})