// server/api/news/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '../../utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12))
  const offset = (page - 1) * limit
  const search = query.q ? String(query.q).trim().toLowerCase() : ''
  const minScore = Number(query.minScore) || 0
  const category = query.category ? String(query.category).trim() : ''

  const db = getDb()

  const res = await db.execute(sql`
    SELECT id, hn_id, title, original_url, slug, summary_it, tags, tech_score, hn_points, hn_by, category, created_at
    FROM hn_stories
    WHERE tech_score >= ${minScore}
      AND (${category} = '' OR category = ${category})
      AND (${search} = '' OR LOWER(title) LIKE ${'%' + search + '%'} OR LOWER(summary_it) LIKE ${'%' + search + '%'})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  const countRes = await db.execute(sql`
    SELECT COUNT(*)::int as total
    FROM hn_stories
    WHERE tech_score >= ${minScore}
      AND (${category} = '' OR category = ${category})
      AND (${search} = '' OR LOWER(title) LIKE ${'%' + search + '%'} OR LOWER(summary_it) LIKE ${'%' + search + '%'})
  `)

  const stories = Array.isArray(res) ? res : (res.rows || [])
  const total = Array.isArray(countRes) ? countRes[0]?.total : (countRes.rows[0]?.total || 0)

  return {
    data: stories,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})