// server/api/blog/posts/[slug].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const rawParam = String(getRouterParam(event, 'slug') || '').trim()
  if (!rawParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID o slug articolo mancante.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  const isNumericId = /^\d+$/.test(rawParam)
  const whereClause = isNumericId
    ? sql`(id = ${Number(rawParam)} OR slug = ${rawParam})`
    : sql`slug = ${rawParam}`

  const deleted = extractRows(
    await db.execute(sql`DELETE FROM blog_posts WHERE ${whereClause} RETURNING id;`)
  )

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato.' })
  }

  return { success: true, deletedId: deleted[0].id }
})