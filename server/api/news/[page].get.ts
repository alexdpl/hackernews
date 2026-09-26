// server/api/news/[page].get.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async (event) => {
  const pageParam = getRouterParam(event, 'page') || '1'
  const page = Math.max(1, parseInt(pageParam, 10) || 1)
  const limit = 15
  const offset = (page - 1) * limit

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return { success: false, page, items: [], totalPages: 1 }
  }

  try {
    const sql = neon(dbUrl)
    const db = drizzle(sql)

    // Se hai la tabella news/stories in Drizzle, effettua la query paginata:
    // Esempio fallback o query Drizzle
    const rawCookies = event.node?.req?.headers?.cookie || ''

    return {
      success: true,
      page,
      limit,
      hasNextPage: page < 10, // Imposta il limite massimo o calcola dal DB
      hasPrevPage: page > 1
    }
  } catch (error: any) {
    return { success: false, page, items: [], error: error.message }
  }
})