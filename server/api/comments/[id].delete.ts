// server/api/comments/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const numericId = Number(id)

  if (!numericId || isNaN(numericId)) {
    return { success: false, message: 'ID commento non valido.' }
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // 1. Recupera il post_id prima di eliminare per aggiornare il contatore
    const commentRes: any = await db.execute(sql`
      SELECT post_id FROM comments WHERE id = ${numericId};
    `)
    const row = Array.isArray(commentRes) ? commentRes[0] : commentRes?.rows?.[0]
    
    // 2. Elimina il commento
    await db.execute(sql`
      DELETE FROM comments WHERE id = ${numericId};
    `)

    // 3. Decrementa il contatore nel post originale
    if (row && row.post_id) {
      await db.execute(sql`
        UPDATE posts 
        SET comments_count = GREATEST(COALESCE(comments_count, 1) - 1, 0) 
        WHERE id = ${row.post_id};
      `).catch(() => {})
    }

    return { success: true, message: 'Commento eliminato con successo.' }
  } catch (err: any) {
    console.error('❌ Errore eliminazione commento:', err?.message)
    return { success: false, message: 'Impossibile eliminare il commento.' }
  }
})