// server/api/dev/godmode.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import crypto from 'crypto'

export default defineEventHandler(async () => {
  const db = await getDb()
  const rawKey = 'dkp_live_admin_master_v26_core_777'
  
  // Generiamo anche l'hash nel caso il tuo sistema di auth (Brevo-style) cripti la stringa prima di cercare nel DB
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

  try {
    // 1. Inserimento Plain-Text
    await db.execute(sql`
      INSERT INTO api_keys (user_id, usage_count, role, status, name, key_hash, key_prefix, key_masked)
      VALUES (41, 0, 'ADMIN', 'ACTIVE', 'Master God Mode', ${rawKey}, 'dkp_live_', '***_777')
    `)

    // 2. Inserimento Hash SHA-256
    await db.execute(sql`
      INSERT INTO api_keys (user_id, usage_count, role, status, name, key_hash, key_prefix, key_masked)
      VALUES (41, 0, 'ADMIN', 'ACTIVE', 'Master God Mode (Hashed)', ${hashedKey}, 'dkp_live_', '***_777')
    `)

    return {
      status: '🔥 GOD MODE ATTIVATO CON SUCCESSO',
      message: 'Chiave Admin Master registrata. Ora il middleware ti farà passare!',
      chiave_da_usare: rawKey
    }

  } catch (err: any) {
    return {
      status: '❌ ERRORE',
      message: err.message
    }
  }
})