import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { createHash, randomBytes } from 'node:crypto'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const action = String(body?.action || 'create')
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  if (action === 'create') {
    const label = String(body?.label || '').trim()
    if (!label) throw createError({ statusCode: 400, statusMessage: 'Nome chiave obbligatorio' })

    const tier = ['STARTER', 'PRO', 'ENTERPRISE'].includes(String(body?.tier)) ? String(body.tier) : 'PRO'
    const rateLimitRpm = Math.max(10, Number(body?.rateLimitRpm || 120))
    const rawSecret = `dkp_live_${randomBytes(18).toString('hex')}`
    const keyPrefix = `${rawSecret.slice(0, 16)}...`
    const keyHash = createHash('sha256').update(rawSecret).digest('hex')

    await db.execute(sql`
      INSERT INTO dkp_api_keys (label, key_prefix, key_hash, tier, rate_limit_rpm, requests_count, is_active)
      VALUES (${label}, ${keyPrefix}, ${keyHash}, ${tier}, ${rateLimitRpm}, 0, TRUE);
    `)

    return {
      success: true,
      secretKey: rawSecret,
      message: 'Nuova API Key generata e registrata nel Gateway Pure SQL!'
    }
  }

  const id = Number(body?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID chiave non valido' })

  if (action === 'toggle') {
    await db.execute(sql`UPDATE dkp_api_keys SET is_active = NOT is_active WHERE id = ${id};`)
    return { success: true, message: `Stato chiave #${id} aggiornato.` }
  }

  if (action === 'delete') {
    await db.execute(sql`DELETE FROM dkp_api_keys WHERE id = ${id};`)
    return { success: true, message: `Chiave #${id} revocata ed eliminata.` }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non valida' })
})