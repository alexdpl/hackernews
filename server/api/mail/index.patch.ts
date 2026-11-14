// server/api/mail/index.patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { requireMailAdmin } from '~~/server/utils/mail-auth'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const body = await readBody(event)
  const id = Number(body?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID messaggio mancante' })

  const db = await getDb()
  if (!db) throw createError({ statusCode: 503, statusMessage: 'Database non connesso' })

  if (typeof body.is_starred === 'boolean') {
    await db.execute(sql`
      UPDATE pulse_mail_messages SET is_starred = ${body.is_starred}, updated_at = NOW() WHERE id = ${id};
    `)
  }

  if (body.status === 'READ' || body.is_read === true) {
    await db.execute(sql`
      UPDATE pulse_mail_messages SET is_read = true, status = 'READ', updated_at = NOW() WHERE id = ${id};
    `)
  }

  return { success: true }
})