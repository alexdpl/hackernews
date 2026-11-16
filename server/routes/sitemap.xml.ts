// server/routes/sitemap.xml.ts
import { defineEventHandler, setResponseHeaders } from 'h3'
import {
  DKP_CANONICAL_ORIGIN,
  DKP_STATIC_ROUTES,
  escapeXml,
  fetchIndexableDkpContent
} from '~~/server/utils/dkpSeoEngine'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'X-Robots-Tag': 'noindex'
  })

  const nowIso = new Date().toISOString()
  const { posts, nodes, threads } = await fetchIndexableDkpContent()

  const urls: string[] = []

  // 1. Pagine Statiche Core, Docs, Tools e Legali
  for (const entry of DKP_STATIC_ROUTES) {
    urls.push(`  <url>
    <loc>${escapeXml(`${DKP_CANONICAL_ORIGIN}${entry.path}`)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`)
  }

  // 2. Nodi della Community
  for (const node of nodes) {
    urls.push(`  <url>
    <loc>${escapeXml(node.url)}</loc>
    <lastmod>${escapeXml(node.updatedAt)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`)
  }

  // 3. Articoli del Blog (v2.6 Pure SQL)
  for (const post of posts) {
    urls.push(`  <url>
    <loc>${escapeXml(post.url)}</loc>
    <lastmod>${escapeXml(post.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`)
  }

  // 4. Thread del Forum & Discussioni
  for (const thread of threads) {
    urls.push(`  <url>
    <loc>${escapeXml(thread.url)}</loc>
    <lastmod>${escapeXml(thread.updatedAt)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.75</priority>
  </url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
})