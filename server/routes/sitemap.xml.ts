// server/routes/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  const baseUrl = 'https://devkernelpulse.duckdns.org'
  const pages = [
    '',
    '/feed',
    '/ask',
    '/show',
    '/jobs',
    '/blog',
    '/submit',
    '/tools/neural-playground',
    '/tools/terminal',
    '/tools/ai-scanner',
    '/tools/proof-of-code'
  ]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`

  setHeader(event, 'Content-Type', 'text/xml; charset=utf-8')
  return sitemapXml
})