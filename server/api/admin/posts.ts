// server/api/admin/posts.ts
import { defineEventHandler, getQuery, createError, getHeader } from 'h3'
import { getDb } from '../../utils/db'
import { posts } from '../../db/schema'
import { desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // 1. Controllo di sicurezza centralizzato (ADMIN_SECRET)
    const config = useRuntimeConfig(event)
    const authHeader = getHeader(event, 'authorization')
    const xAdminSecret = getHeader(event, 'x-admin-secret')

    // Supporta sia l'header 'x-admin-secret' sia l'header 'Authorization: Bearer <token>'
    const token = xAdminSecret || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader)

    if (!config.adminSecret || !token || token !== config.adminSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Accesso negato. Chiave amministrativa non valida o mancante.',
      })
    }

    // 2. Estrazione e normalizzazione parametri di paginazione O(N)
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string, 10) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(query.limit as string, 10) || 30))
    const offset = (page - 1) * limit

    const db = getDb()

    // 3. Esecuzione parallela indicizzata su Neon Database
    const [dataResult, countResult] = await Promise.all([
      db
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
    ])

    // Conversione sicura in numero per evitare mismatch di tipo da Postgres
    const totalPosts = Number(countResult?.[0]?.count || 0)
    const totalPages = Math.ceil(totalPosts / limit) || 1
    const hasMore = offset + dataResult.length < totalPosts

    // 4. Risposta unificata e speculare al frontend
    return {
      success: true,
      data: dataResult,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages,
        hasMore
      }
    }

  } catch (error: any) {
    console.error('=== [ADMIN API ERROR] FALLIMENTO PAGINAZIONE MANUTENZIONE ===', error)

    // Preserva gli errori 401/400 già gestiti
    if (error.statusCode) {
      throw error
    }

    // Format unico per gli errori di connessione DB Neon
    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB Neon: impossibile recuperare i dati di manutenzione (${error.message || 'Errore interno'})`,
    })
  }
})