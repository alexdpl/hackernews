// server/api/admin/posts.ts
import { defineEventHandler, getQuery, createError, getHeader } from 'h3'
import { getDb } from '../../utils/db'
import { posts } from '../../db/schema'
import { desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // 1. Controllo di sicurezza centralizzato (NUXT_ADMIN_SECRET)
    const config = useRuntimeConfig()
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token || token !== config.adminSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Accesso negato. Chiave amministrativa non valida.',
      })
    }

    // 2. Estrazione e normalizzazione della paginazione O(N)
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 30))
    const offset = (page - 1) * limit

    const db = getDb()

    // 3. Esecuzione del conteggio e della selezione limitata
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

    const totalPosts = countResult?.[0]?.count || countResult?.count || 0
    const hasMore = offset + dataResult.length < totalPosts

    // 4. Struttura dati speculare a quella attesa dal Frontend ristrutturato
    return {
      success: true,
      data: dataResult,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore
      }
    }

  } catch (error: any) {
    console.error('=== [ADMIN API ERROR] FALLIMENTO PAGINAZIONE MANUTENZIONE ===', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Errore interno durante il recupero dei dati di manutenzione.',
    })
  }
})