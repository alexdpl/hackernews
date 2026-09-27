// server/api/admin/autoresponder/index.ts
import { defineEventHandler, readBody, getMethod } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const db = getDb()
  if (!db) return { success: false, rules: [] }

  // Auto-migration tabella regole
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pulse_autoresponder_rules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      trigger_address VARCHAR(255) NOT NULL,
      subject_template TEXT NOT NULL,
      body_template TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)

  const method = getMethod(event)

  if (method === 'GET') {
    const rulesResult: any = await db.execute(sql`
      SELECT * FROM pulse_autoresponder_rules ORDER BY created_at DESC;
    `)
    return {
      success: true,
      rules: Array.isArray(rulesResult) ? rulesResult : (rulesResult?.rows || [])
    }
  }

  if (method === 'POST') {
    const body = await readBody(event) || {}
    const { name, trigger_address, subject_template, body_template, is_active } = body

    if (!name || !trigger_address || !body_template) {
      return { success: false, error: 'Tutti i campi obbligatori devono essere compilati' }
    }

    await db.execute(sql`
      INSERT INTO pulse_autoresponder_rules (name, trigger_address, subject_template, body_template, is_active)
      VALUES (${name}, ${trigger_address}, ${subject_template || 'Re: Automatic Response'}, ${body_template}, ${is_active ?? true});
    `)

    return { success: true, message: 'Regola salvata con successo!' }
  }
})