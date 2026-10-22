// server/api/v2.5/ads/manage.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { dkpAds } from '~~/server/db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, parseInt(query.limit as string) || 5) // 🟢 Limite fissato a 5
    const offset = (page - 1) * limit

    const db = await getDb()
    
    // Estrae le campagne con paginazione
    const allAds = await db.select()
      .from(dkpAds)
      .orderBy(desc(dkpAds.createdAt))
      .limit(limit + 1) // Ne peschiamo 1 in più per sapere se c'è una pagina successiva
      .offset(offset)

    const hasMore = allAds.length > limit
    const items = hasMore ? allAds.slice(0, limit) : allAds

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        hasMore
      }
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore nel recupero della lista inserzioni: ' + err.message
    })
  }
})