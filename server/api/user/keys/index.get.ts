// server/api/user/keys/index.get.ts
import { defineEventHandler, createError, setResponseHeaders } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId ? Number(query.userId) : 1
  const db = getDb()

  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

 try {
    // Eseguiamo una select semplice e diretta sulla tabella apiKeys senza join a rischio di undefined
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt))

    return {
      success: true,
      data: keys
    }
  } catch (error: any) {
    console.error('❌ Errore recupero chiavi API dal DB:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore database Neon: ${error.message}`
    })
  }
})