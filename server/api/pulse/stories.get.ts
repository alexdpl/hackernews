// server/api/pulse/stories.get.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Estrazione protetta dei parametri query (previene crash su Invalid URL di H3)
    let query: Record<string, any> = {}
    try {
      query = getQuery(event) || {}
    } catch {
      try {
        const rawPath = event.path || event.node?.req?.url || ''
        const queryString = rawPath.includes('?') ? rawPath.split('?')[1] : ''
        const params = new URLSearchParams(queryString)
        query = Object.fromEntries(params.entries())
      } catch {
        query = {}
      }
    }

    const rawType = (query.type || query.section || 'news').toString().toLowerCase()
    
    // Normalizzazione rigorosa della categoria
    let type = 'news'
    if (rawType.includes('ask')) type = 'ask'
    else if (rawType.includes('show')) type = 'show'
    else if (rawType.includes('job')) type = 'jobs'

    // Paginazione sicura
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 15))
    const offset = (page - 1) * limit

    const db = getDb()
    if (!db) {
      return { 
        success: false, 
        stories: [], 
        count: 0,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
        message: 'Database Neon non disponibile' 
      }
    }

    // 1. Conteggio totale elementi per la categoria
    const countResult: any = await db.execute(sql`
      SELECT COUNT(*)::int as total FROM pulse_stories WHERE type = ${type};
    `)
    const totalItems = countResult?.rows?.[0]?.total ?? countResult?.[0]?.total ?? 0
    const totalPages = Math.ceil(totalItems / limit) || 1

    // 2. Query Paginata per il Feed
    const result: any = await db.execute(sql`
      SELECT id, title, url, domain, type, author, points, comments_count, xp_awarded, created_at
      FROM pulse_stories
      WHERE type = ${type}
      ORDER BY created_at DESC, points DESC
      LIMIT ${limit} OFFSET ${offset};
    `)

    const stories = result?.rows || result || []

    return {
      success: true,
      category: type,
      count: stories.length,
      stories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems
      }
    }
  } catch (err: any) {
    console.error('[API PULSE STORIES ERROR]:', err?.message)
    return {
      success: false,
      category: 'news',
      count: 0,
      stories: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      error: err?.message || 'Errore durante il recupero del feed'
    }
  }
})