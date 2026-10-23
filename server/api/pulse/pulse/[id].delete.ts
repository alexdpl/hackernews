// server/api/pulse/stories/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const numericId = Number(id)

  if (!numericId || isNaN(numericId)) {
    return { success: false, message: 'ID post non valido.' }
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // Elimina il post
    await db.execute(sql`
      DELETE FROM posts WHERE id = ${numericId};
    `)

    // Opzionale: Elimina anche i commenti associati per mantenere pulito il DB
    await db.execute(sql`
      DELETE FROM comments WHERE post_id = ${numericId};
    `).catch(() => {})

    return { success: true, message: 'Post eliminato con successo.' }
  } catch (err: any) {
    console.error('❌ Errore eliminazione post:', err?.message)
    return { success: false, message: 'Impossibile eliminare il post.' }
  }
})