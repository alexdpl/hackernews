import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  const baseUrl = 'https://devkernelpulse.org'
  const staticRoutes = [
    '/', '/feed', '/news', '/newest', '/ask', '/show', '/jobs',
    '/nodes', '/nodes/n/blockchain-vault', '/blog', '/tools',
    '/ecosystem', '/roadmap', '/faq'
  ]

  const urls: string[] = staticRoutes.map(
    (path) => `<url><loc>${baseUrl}${path}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`
  )

  try {
    const db = await getDb()
    if (db) {
      // 1. Articoli Blog (/blog/[slug])
      const blogRes = await db.execute(sql`
        SELECT slug, COALESCE(updated_at, created_at) AS lastmod
        FROM blog_posts
        WHERE UPPER(COALESCE(status, 'PUBLISHED')) = 'PUBLISHED'
        ORDER BY created_at DESC LIMIT 300;
      `).catch(() => [])
      for (const row of extractRows(blogRes)) {
        if (row.slug) {
          urls.push(`<url><loc>${baseUrl}/blog/${row.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`)
        }
      }

      // 2. Nodi tematici (/nodes/n/[slug])
      const nodeListRes = await db.execute(sql`
        SELECT slug FROM nodes ORDER BY id ASC LIMIT 250;
      `).catch(() => [])
      for (const row of extractRows(nodeListRes)) {
        if (row.slug) {
          urls.push(`<url><loc>${baseUrl}/nodes/n/${row.slug}</loc><changefreq>daily</changefreq><priority>0.85</priority></url>`)
        }
      }

      // 3. Discussioni nei Nodi (/nodes/thread/[id])
      const nodesRes = await db.execute(sql`
        SELECT id FROM node_posts ORDER BY created_at DESC LIMIT 400;
      `).catch(() => [])
      for (const row of extractRows(nodesRes)) {
        if (row.id) {
          urls.push(`<url><loc>${baseUrl}/nodes/thread/${row.id}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`)
        }
      }

      // 4. Segnali Tech & Crawler (/news/[slug])
      const hnRes = await db.execute(sql`
        SELECT id, hn_id, slug FROM hn_stories ORDER BY id DESC LIMIT 400;
      `).catch(() => [])
      for (const row of extractRows(hnRes)) {
        const cleanSlug = row.slug || `story-${row.hn_id || row.id}`
        urls.push(`<url><loc>${baseUrl}/news/${cleanSlug}</loc><changefreq>daily</changefreq><priority>0.75</priority></url>`)
      }
    }
  } catch {}

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
})