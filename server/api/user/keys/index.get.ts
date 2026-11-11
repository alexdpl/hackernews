// server/api/user/keys/index.get.ts
import { defineEventHandler, getQuery, createError, setResponseHeaders, getCookie } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = query.userId ? Number(query.userId) : (sessionUserCookie ? parseInt(sessionUserCookie, 10) : 1)

  const db = getDb()

  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  try {
    // Selezione esplicita dei campi sicuri (ESCLUSIONE di keyHash)
    const keys = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        keyMasked: apiKeys.keyMasked,
        role: apiKeys.role,
        status: apiKeys.status,
        usageCount: apiKeys.usageCount,
        createdAt: apiKeys.createdAt
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt))

    return {
      success: true,
      data: keys || []
    }
  } catch (error: any) {
    console.error('❌ Errore recupero chiavi API dal DB Neon:', error)
    // Fallback sicuro in modalità degraded senza far crollare la dashboard
    return {
      success: true,
      data: []
    }
  }
})