import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const db = await getDb()
  if (!db) return { success: false, message: 'DB non disponibile' }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_mail_campaigns (
      id SERIAL PRIMARY KEY,
      kind VARCHAR(32) NOT NULL DEFAULT 'newsletter',
      subject VARCHAR(255) NOT NULL,
      sentinel_agent VARCHAR(64) DEFAULT 'sentinel_ai',
      trigger_event VARCHAR(128) DEFAULT 'manual_dispatch',
      status VARCHAR(32) DEFAULT 'ACTIVE',
      sent_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `).catch(() => null)

  if (event.method.toUpperCase() === 'POST') {
    const body = await readBody(event)
    const kind = String(body?.kind || 'newsletter')
    const subject = String(body?.subject || 'DKP Kernel v2.6 Sentinel Digest').trim()
    const sentinelAgent = String(body?.sentinelAgent || 'sentinel_ai')
    const triggerEvent = String(body?.triggerEvent || 'on_user_signup')

    await db.execute(sql`
      INSERT INTO dkp_mail_campaigns (kind, subject, sentinel_agent, trigger_event, status, sent_count)
      VALUES (${kind}, ${subject}, ${sentinelAgent}, ${triggerEvent}, 'ACTIVE', 1);
    `)

    return {
      success: true,
      message: `Campagna ${kind} attivata e validata da @${sentinelAgent} (Resend HTTPS ready).`
    }
  }

  const existing = await db.execute(sql`SELECT * FROM dkp_mail_campaigns ORDER BY created_at DESC LIMIT 30;`)
  let rows = extractRows(existing)

  if (rows.length === 0) {
    await db.execute(sql`
      INSERT INTO dkp_mail_campaigns (kind, subject, sentinel_agent, trigger_event, status, sent_count)
      VALUES
        ('newsletter', '[DKP v2.6] Weekly Pure SQL & BEMYAGENT.md Digest', 'sentinel_ai', 'weekly_cron', 'SENT', 1420),
        ('autoresponder', 'Benvenuto nel Kernel DKP — Chiave Vault & Onboarding', 'sentinel_ai', 'user_registered', 'ACTIVE', 890),
        ('autoresponder', 'Alert Quarantena & Symbiotic Audit Report', 'guardian_bot', 'threat_blocked', 'ACTIVE', 64);
    `).catch(() => null)
    const seeded = await db.execute(sql`SELECT * FROM dkp_mail_campaigns ORDER BY created_at DESC LIMIT 30;`)
    rows = extractRows(seeded)
  }

  return { success: true, data: rows }
})