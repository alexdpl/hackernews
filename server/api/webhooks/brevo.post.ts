// server/api/webhooks/brevo.post.ts
import { defineEventHandler, readBody, getRequestHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const secretHeader = getRequestHeader(event, 'x-sib-server-secret')
  const expectedSecret = process.env.BREVO_WEBHOOK_SECRET

  if (expectedSecret && secretHeader !== expectedSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Firma Webhook Non Valida' })
  }

  const payload = await readBody(event)
  const eventType = String(payload?.event || '').trim().toLowerCase()
  const email = String(payload?.email || '').trim().toLowerCase()
  const messageId = String(payload?.['message-id'] || payload?.messageId || `${eventType}:${email}:${Date.now()}`).trim()

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database non disponibile' })
  }

  // 1. Tabelle e colonne idempotenti Pure SQL
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS processed_webhooks (
      message_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      recipient_email TEXT,
      processed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_subscribed BOOLEAN NOT NULL DEFAULT true;`)
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_optin BOOLEAN NOT NULL DEFAULT true;`)

  // 2. Controllo idempotenza
  const existing = await db.execute(sql`
    SELECT message_id FROM processed_webhooks WHERE message_id = ${messageId} LIMIT 1;
  `)
  if (extractRows(existing).length > 0) {
    return { success: true, status: 'already_processed' }
  }

  // 3. Aggiorna stato iscrizione su hard_bounce, spam, unsubscribed
  if (email && (eventType === 'hard_bounce' || eventType === 'spam' || eventType === 'unsubscribed')) {
    await db.execute(sql`
      UPDATE users
      SET email_subscribed = false,
          newsletter_optin = false
      WHERE LOWER(email) = ${email};
    `).catch(() => null)
  }

  // 4. Registra evento elaborato
  await db.execute(sql`
    INSERT INTO processed_webhooks (message_id, event_type, recipient_email)
    VALUES (${messageId}, ${eventType || 'unknown'}, ${email || null})
    ON CONFLICT (message_id) DO NOTHING;
  `)

  return { success: true, processed: true, event: eventType }
})