// server/api/webhooks/brevo.post.ts
import { defineEventHandler, readBody, getRequestHeader, createError } from 'h3'

export default defineEventHandler(async (event) => {
  // 1. Authenticate Webhook Secret
  const secretHeader = getRequestHeader(event, 'x-sib-server-secret')
  const expectedSecret = process.env.BREVO_WEBHOOK_SECRET

  if (expectedSecret && secretHeader !== expectedSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Firma Webhook Non Valida' })
  }

  const payload = await readBody(event)
  const { event: eventType, email, 'message-id': messageId } = payload
  const sql = usePureSql()

  // 2. Controllo Idempotenza: Verifica se l'evento è già stato processato
  await sql`
    CREATE TABLE IF NOT EXISTS processed_webhooks (
      message_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  const existingWebhook: any = await sql`
    SELECT message_id FROM processed_webhooks WHERE message_id = ${messageId}
  `
  const isDuplicate = existingWebhook.length > 0 || (existingWebhook.rows && existingWebhook.rows.length > 0)

  if (isDuplicate) {
    return { status: 'already_processed' }
  }

  // 3. Gestione Eventi Bounce & Unsubscribe su Database Neon
  switch (eventType) {
    case 'hard_bounce':
    case 'spam':
    case 'unsubscribed':
      try {
        await sql`
          UPDATE users 
          SET newsletter_optin = false 
          WHERE email = ${email}
        `
        console.log(`[BREVO WEBHOOK] Contatto ${email} disattivato causa: ${eventType}`)
      } catch (err) {
        console.warn(`[BREVO DB WARN] Utente ${email} non trovato per disattivazione.`)
      }
      break
    case 'delivered':
      console.log(`[BREVO WEBHOOK] Email consegnata con successo a ${email} (Msg ID: ${messageId})`)
      break
  }

  // 4. Registra messaggio nei webhook elaborati
  await sql`
    INSERT INTO processed_webhooks (message_id, event_type)
    VALUES (${messageId}, ${eventType})
    ON CONFLICT DO NOTHING
  `

  return { success: true, processed: true }
})