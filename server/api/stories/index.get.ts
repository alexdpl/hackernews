// server/api/stories/index.get.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { getQuery } from 'h3'

/**
 * Parser sicuro delle query string che gestisce sia le richieste HTTP reali
 * sia le chiamate simulate in-memory (SSR / node-mock-http).
 */
function parseEventQuery(event: any) {
  try {
    const q = getQuery(event)
    if (q && Object.keys(q).length > 0) return q
  } catch (e) {
    // Fallback in caso di URL relativo durante l'SSR
  }

  const rawUrl = event.path || event.node?.req?.url || ''
  if (!rawUrl) return {}

  const dummyBase = 'http://localhost'
  const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${dummyBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
  
  try {
    const parsed = new URL(fullUrl)
    const result: Record<string, string> = {}
    parsed.searchParams.forEach((val, key) => {
      result[key] = val
    })
    return result
  } catch {
    return {}
  }
}

export default defineEventHandler(async (event) => {
  const query = parseEventQuery(event)
  
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.max(1, parseInt(query.limit as string) || 15) // Default 15 notizie per pagina
  const type = (query.type as string) || 'news' // 'news' | 'ask' | 'show' | 'jobs'
  const offset = (page - 1) * limit

  const db = getDb()
  if (!db) {
    return { stories: [], total: 0, totalPages: 1, currentPage: page }
  }

  try {
    // 1. Conteggio totale per tipo
    const countRes: any = await db.execute(sql`
      SELECT COUNT(*) as count FROM pulse_stories WHERE type = ${type};
    `)
    const total = parseInt(countRes?.rows?.[0]?.count || countRes?.[0]?.count || '0')
    const totalPages = Math.ceil(total / limit) || 1

    // 2. Fetch notizie per pagina
    const storiesRes: any = await db.execute(sql`
      SELECT id, title, url, domain, points, author, type, created_at
      FROM pulse_stories
      WHERE type = ${type}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `)

    const stories = storiesRes?.rows || storiesRes || []

    return {
      success: true,
      stories,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }
  } catch (err: any) {
    console.error('[STORIES API ERROR]:', err?.message)
    return { stories: [], total: 0, totalPages: 1, currentPage: page }
  }
})