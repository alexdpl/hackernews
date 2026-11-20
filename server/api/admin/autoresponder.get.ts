import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const db = await getDb()
  if (!db) return { success: true, rules: [] }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_autoresponder_rules (
      id SERIAL PRIMARY KEY,
      trigger_event VARCHAR(80) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      body_template TEXT DEFAULT '',
      sender_alias VARCHAR(120) DEFAULT 'noreply@devkernelpulse.org',
      sent_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  const countRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM dkp_autoresponder_rules;`)
  if (Number(extractRows(countRes)[0]?.cnt || 0) === 0) {
    await db.execute(sql`
      INSERT INTO dkp_autoresponder_rules (trigger_event, subject, body_template, sender_alias, sent_count, is_active)
      VALUES
        ('user_registered', 'Benvenuto su DevKernelPulse — Accesso Kernel Attivo', 'Ciao {{username}}, il tuo profilo developer su DevKernelPulse è attivo.', 'noreply@devkernelpulse.org', 142, TRUE),
        ('sentinel_alert', '[SENTINEL SAST] Rilevata anomalia di sicurezza nel snippet', 'Il motore Pulse Sentinel AI ha segnalato una vulnerabilità da verificare.', 'security@devkernelpulse.org', 19, TRUE);
    `)
  }

  const rows = await db.execute(sql`
    SELECT
      id,
      trigger_event AS "triggerEvent",
      subject,
      body_template AS "bodyTemplate",
      sender_alias AS "senderAlias",
      sent_count AS "sentCount",
      is_active AS "isActive",
      created_at AS "createdAt"
    FROM dkp_autoresponder_rules
    ORDER BY id DESC;
  `)

  return { success: true, rules: extractRows(rows) }
})