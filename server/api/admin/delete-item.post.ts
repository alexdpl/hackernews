// server/api/admin/delete-item.post.ts
import { defineEventHandler, readBody, getCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = getCookie(event, 'dkp_user')
  if (user !== 'alexdpl') {
    return { success: false, error: 'Non autorizzato. Solo alexdpl può moderare.' }
  }

  const body = await readBody(event)
  const { id, type } = body // type: 'post' o 'comment'

  if (!id || !type) {
    return { success: false, error: 'Parametri mancanti' }
  }

  const db = getDb()

  try {
    if (type === 'post') {
      await db.execute(sql`DELETE FROM posts WHERE id = ${Number(id)}`)
      await db.execute(sql`DELETE FROM comments WHERE post_id = ${Number(id)}`)
    } else if (type === 'comment') {
      await db.execute(sql`DELETE FROM comments WHERE id = ${Number(id)}`)
    }

    return { success: true, message: 'Elemento eliminato con successo' }
  } catch (err: any) {
    console.error('Errore moderazione:', err)
    return { success: false, error: err.message }
  }
})