// server/api/nodes/index.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) {
      return { success: true, data: [] }
    }

    // Seleziona tutti i DKP Nodes ordinati per numero di iscritti
    const result: any = await db.execute(sql`
      SELECT 
        id, 
        name, 
        slug, 
        description, 
        icon, 
        color, 
        subscribers_count AS "subscribersCount", 
        is_private AS "isPrivate", 
        created_at AS "createdAt"
      FROM nodes
      ORDER BY subscribers_count DESC, id ASC;
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])

    return {
      success: true,
      data: rows
    }
  } catch (err: any) {
    console.error('❌ [NODES GET ERROR]:', err?.message)
    return {
      success: false,
      message: 'Errore durante il recupero dei DKP Nodes.',
      data: []
    }
  }
})