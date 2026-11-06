// server/api/news/[slug].get.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '../../utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug mancante.' })
  }

  const db = getDb()
  const res = await db.execute(sql`
    SELECT id, hn_id, title, original_url, slug, summary_it, tags, tech_score, hn_points, hn_by, category, created_at
    FROM hn_stories
    WHERE slug = ${slug}
    LIMIT 1
  `)

  const story = Array.isArray(res) ? res[0] : (res.rows[0] || null)

  if (!story) {
    throw createError({ statusCode: 404, statusMessage: 'Notizia non trovata nel Vault News.' })
  }

  return { data: story }
})