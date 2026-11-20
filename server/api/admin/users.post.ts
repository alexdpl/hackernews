import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = Number(body?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID utente non valido' })

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  const action = String(body?.action || '')
  if (action === 'set_role') {
    const role = ['ADMIN', 'MODERATOR', 'BUILDER', 'USER'].includes(String(body?.role)) ? String(body.role) : 'USER'
    await db.execute(sql`UPDATE users SET role = ${role} WHERE id = ${id};`)
    return { success: true, message: `Ruolo utente #${id} aggiornato a ${role}.` }
  }

  if (action === 'toggle_ban') {
    await db.execute(sql`UPDATE users SET is_banned = NOT COALESCE(is_banned, FALSE) WHERE id = ${id};`)
    return { success: true, message: `Stato ban utente #${id} aggiornato.` }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non supportata' })
})