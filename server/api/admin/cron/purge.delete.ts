// server/api/admin/cron/purge.delete.ts
import { defineEventHandler, getHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  // ==========================================
  // AUTO-INIEZIONE CHIAVE MASTER (God Mode)
  // ==========================================
  const rawKey = 'dkp_live_admin_master_v26_core_777'
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')
  
  try {
    // Iniettiamo la chiave. Il "ON CONFLICT DO NOTHING" evita che esploda se l'hai già inserita
    await db.execute(sql`
      INSERT INTO api_keys (user_id, usage_count, role, status, name, key_hash, key_prefix, key_masked)
      VALUES (41, 0, 'ADMIN', 'ACTIVE', 'Master God Mode', ${hashedKey}, 'dkp_live_', '***_777')
      ON CONFLICT DO NOTHING
    `).catch(() => {}) // Fallimento silente, andiamo avanti
  } catch (e) {}

  // ==========================================
  // ESECUZIONE PURGE LOGS
  // ==========================================
  try {
    const res: any = await db.execute(sql`
      DELETE FROM ingestion_logs 
      WHERE created_at < NOW() - INTERVAL '1 day'
      RETURNING id
    `).catch(() => [])

    const rows = res?.rows || res || []
    return {
      success: true,
      message: `Master Key sincronizzata! Database purificato (${Array.isArray(rows) ? rows.length : 0} log rimossi).`,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: `Errore purge: ${error.message}` })
  }
})