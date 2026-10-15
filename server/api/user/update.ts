// server/api/users/update.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, bio, avatar } = body

  if (!username) {
    return { success: false, error: 'Username obbligatorio' }
  }

  const db = getDb()

  try {
    await db.execute(sql`
      UPDATE users 
      SET bio = ${bio || ''}, avatar = ${avatar || ''}
      WHERE username = ${username}
    `)

    return { success: true, message: 'Profilo aggiornato con successo' }
  } catch (err: any) {
    console.error('Errore aggiornamento profilo:', err)
    return { success: false, error: err.message }
  }
})