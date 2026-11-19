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
    '/', '/feed', '/newest', '/ask', '/show', '/jobs',
    '/nodes', '/nodes/blockchain-vault', '/blog', '/tools',
    '/ecosystem', '/roadmap', '/faq'
  ]

  const urls: string[] = staticRoutes.map(
    (path) => `<url><loc>${baseUrl}${path}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`
  )

  try {
    const db = await getDb()
    if (db) {
      const blogRes = await db.execute(sql`SELECT slug, updated_at FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 200;`).catch(() => [])
      for (const row of extractRows(blogRes)) {
        if (row.slug) {
          urls.push(`<url><loc>${baseUrl}/blog/${row.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`)
        }
      }

      const nodesRes = await db.execute(sql`SELECT id, created_at FROM node_posts ORDER BY created_at DESC LIMIT 300;`).catch(() => [])
      for (const row of extractRows(nodesRes)) {
        if (row.id) {
          urls.push(`<url><loc>${baseUrl}/nodes/post/${row.id}</loc><changefreq>daily</changefreq><priority>0.85</priority></url>`)
        }
      }

      const hnRes = await db.execute(sql`SELECT id FROM hn_items ORDER BY created_at DESC LIMIT 300;`).catch(() => [])
      for (const row of extractRows(hnRes)) {
        if (row.id) {
          urls.push(`<url><loc>${baseUrl}/item/${row.id}</loc><changefreq>daily</changefreq><priority>0.75</priority></url>`)
        }
      }
    }
  } catch {}

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
})