import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const action = String(body?.action || 'create')
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  if (action === 'create') {
    const subject = String(body?.subject || '').trim()
    if (!subject) throw createError({ statusCode: 400, statusMessage: 'Oggetto email obbligatorio' })
    const triggerEvent = String(body?.triggerEvent || 'user_registered').trim()
    const bodyTemplate = String(body?.bodyTemplate || 'Messaggio automatico generato da DKP Mail Nexus.').trim()
    const senderAlias = String(body?.senderAlias || 'noreply@devkernelpulse.org').trim()

    await db.execute(sql`
      INSERT INTO dkp_autoresponder_rules (trigger_event, subject, body_template, sender_alias, sent_count, is_active)
      VALUES (${triggerEvent}, ${subject}, ${bodyTemplate}, ${senderAlias}, 0, TRUE);
    `)

    return { success: true, message: 'Regola Autoresponder attivata su Neon Pure SQL!' }
  }

  const id = Number(body?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID regola non valido' })

  if (action === 'toggle') {
    await db.execute(sql`UPDATE dkp_autoresponder_rules SET is_active = NOT is_active WHERE id = ${id};`)
    return { success: true, message: `Stato regola #${id} aggiornato.` }
  }

  if (action === 'delete') {
    await db.execute(sql`DELETE FROM dkp_autoresponder_rules WHERE id = ${id};`)
    return { success: true, message: `Regola #${id} eliminata.` }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non valida' })
})