// server/services/mail.service.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendKernelEmail } from '~~/server/utils/mailer'
import { sanitizeEmailHtml } from '~~/server/utils/sanitizer'

export interface OutboundPayload {
  from: string
  to: string
  subject: string
  html: string
  replyToId?: number
}

export class MailService {
  /**
   * Recupera i messaggi con body sanitizzato per la Webmail
   */
  static async getMessages(limit = 50, direction?: 'INBOUND' | 'OUTBOUND') {
    const db = getDb()
    if (!db) return { mails: [], unreadCount: 0 }

    let query = sql`SELECT * FROM pulse_mail_messages ORDER BY created_at DESC LIMIT ${limit}`
    if (direction) {
      query = sql`SELECT * FROM pulse_mail_messages WHERE direction = ${direction} ORDER BY created_at DESC LIMIT ${limit}`
    }

    const res: any = await db.execute(query)
    const rows = Array.isArray(res) ? res : (res?.rows || [])

    // Processamento e sanitizzazione in lettura
    const mails = rows.map((m: any) => ({
      ...m,
      body_html: sanitizeEmailHtml(m.body_html || '')
    }))

    const unreadRes: any = await db.execute(sql`
      SELECT COUNT(*) as unread FROM pulse_mail_messages WHERE is_read = false AND direction = 'INBOUND'
    `)
    const unreadCount = unreadRes?.rows?.[0]?.unread || unreadRes?.[0]?.unread || 0

    return { mails, unreadCount }
  }

  /**
   * Processa una mail in ingresso (Webhook Cloudflare)
   */
  static async processInbound(sender: string, recipient: string, subject: string, rawHtml: string) {
    const db = getDb()
    if (!db) throw new Error('Database non connesso')

    const cleanHtml = sanitizeEmailHtml(rawHtml)

    // 1. Salva il messaggio nel DB
    const insertRes: any = await db.execute(sql`
      INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status, is_read)
      VALUES (${sender}, ${recipient}, ${subject}, ${cleanHtml}, 'INBOUND', 'RECEIVED', false)
      RETURNING id;
    `)

    const messageId = insertRes?.rows?.[0]?.id || insertRes?.[0]?.id

    // 2. Registra il log di sistema
    await this.logEvent('INBOUND_RECEIVED', messageId, sender, recipient, `Subject: ${subject}`)

    // 3. Controlla e lancia eventuali Autoresponder Rules
    await this.triggerAutoresponder(sender, recipient, subject)

    return { success: true, messageId }
  }

  /**
   * Spedisce una mail in uscita con gestione della Retry Queue in caso di errore SMTP
   */
  static async sendOutbound(payload: OutboundPayload) {
    const db = getDb()
    const cleanHtml = sanitizeEmailHtml(payload.html)

    try {
      // Tentativo invio via Nodemailer SMTP
      await sendKernelEmail({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: cleanHtml
      })

      // Salva come SENT nel DB
      let messageId = null
      if (db) {
        const res: any = await db.execute(sql`
          INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status, reply_to_id)
          VALUES (${payload.from}, ${payload.to}, ${payload.subject}, ${cleanHtml}, 'OUTBOUND', 'SENT', ${payload.replyToId || null})
          RETURNING id;
        `)
        messageId = res?.rows?.[0]?.id || res?.[0]?.id
      }

      await this.logEvent('OUTBOUND_SENT', messageId, payload.from, payload.to, 'Mail inviata con successo via SMTP Relay')
      return { success: true, queued: false }

    } catch (err: any) {
      console.error('[MAIL SERVICE SMTP ERROR]:', err?.message)

      // Inserisce nella Retry Queue se SMTP fallisce
      if (db) {
        await db.execute(sql`
          INSERT INTO pulse_mail_queue (sender, recipient, subject, body_html, status, last_error)
          VALUES (${payload.from}, ${payload.to}, ${payload.subject}, ${cleanHtml}, 'PENDING', ${err?.message || 'SMTP Failure'});
        `)
      }

      await this.logEvent('SMTP_ERROR', null, payload.from, payload.to, `Aggiunto alla coda retry: ${err?.message}`)
      return { success: false, queued: true, error: err?.message }
    }
  }

  /**
   * Processa la Coda dei Re-invii (Retry Queue Worker)
   */
  static async processRetryQueue() {
    const db = getDb()
    if (!db) return

    const pendingItems: any = await db.execute(sql`
      SELECT * FROM pulse_mail_queue 
      WHERE status = 'PENDING' AND attempts < max_attempts AND next_retry_at <= CURRENT_TIMESTAMP 
      LIMIT 10;
    `)

    const rows = pendingItems?.rows || pendingItems || []

    for (const item of rows) {
      try {
        await db.execute(sql`UPDATE pulse_mail_queue SET status = 'PROCESSING', attempts = attempts + 1 WHERE id = ${item.id}`)

        await sendKernelEmail({
          from: item.sender,
          to: item.recipient,
          subject: item.subject,
          html: item.body_html
        })

        // Segna come completato
        await db.execute(sql`UPDATE pulse_mail_queue SET status = 'SENT' WHERE id = ${item.id}`)
        await this.logEvent('RETRY_SUCCESS', null, item.sender, item.recipient, `Rinviato con successo al tentativo #${item.attempts + 1}`)

      } catch (retryErr: any) {
        const nextRetry = new Date(Date.now() + (item.attempts + 1) * 5 * 60 * 1000) // Backoff esponenziale
        await db.execute(sql`
          UPDATE pulse_mail_queue 
          SET status = 'PENDING', last_error = ${retryErr?.message}, next_retry_at = ${nextRetry.toISOString()} 
          WHERE id = ${item.id};
        `)
        await this.logEvent('RETRY_FAILED', null, item.sender, item.recipient, `Tentativo #${item.attempts + 1} fallito: ${retryErr?.message}`)
      }
    }
  }

  /**
   * Trigger automatico risposte autoresponder
   */
  private static async triggerAutoresponder(sender: string, recipient: string, incomingSubject: string) {
    const db = getDb()
    if (!db) return

    const rulesRes: any = await db.execute(sql`
      SELECT * FROM pulse_autoresponder_rules WHERE is_active = true AND target_address = ${recipient};
    `)
    const rules = rulesRes?.rows || rulesRes || []

    for (const rule of rules) {
      const matchKey = rule.keyword_trigger ? incomingSubject.toLowerCase().includes(rule.keyword_trigger.toLowerCase()) : true

      if (matchKey) {
        // Invia la risposta automatica
        await this.sendOutbound({
          from: recipient,
          to: sender,
          subject: `Re: ${incomingSubject}`,
          html: rule.response_template
        })
        await this.logEvent('AUTO_RESPONDED', null, recipient, sender, `Triggered rule ID: ${rule.id}`)
      }
    }
  }

  /**
   * Helper Registrazione Log Eventi
   */
  private static async logEvent(type: string, messageId: number | null, sender: string, recipient: string, details: string) {
    const db = getDb()
    if (db) {
      await db.execute(sql`
        INSERT INTO pulse_mail_logs (event_type, message_id, sender, recipient, details)
        VALUES (${type}, ${messageId}, ${sender}, ${recipient}, ${details});
      `)
    }
  }
}