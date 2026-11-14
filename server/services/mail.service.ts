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

export interface GetMessagesOptions {
  page?: number
  limit?: number
  direction?: 'INBOUND' | 'OUTBOUND'
  search?: string
}

let schemaInitialized = false

function extractRows(res: any): any[] {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.rows)) return res.rows
  return []
}

export class MailService {
  /**
   * Auto-migrazione idempotente Pure SQL (compatibile v2.4 + v2.6)
   */
  static async ensureSchema() {
    if (schemaInitialized) return
    const db = await getDb()
    if (!db) return

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_mail_messages (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body_text TEXT,
        body_html TEXT,
        direction VARCHAR(20) NOT NULL DEFAULT 'INBOUND',
        status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
        is_read BOOLEAN NOT NULL DEFAULT false,
        is_starred BOOLEAN NOT NULL DEFAULT false,
        reply_to_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await db.execute(sql`ALTER TABLE pulse_mail_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;`)
    await db.execute(sql`ALTER TABLE pulse_mail_messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;`)
    await db.execute(sql`ALTER TABLE pulse_mail_messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;`)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_mail_queue (
        id SERIAL PRIMARY KEY,
        sender TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body_html TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        last_error TEXT,
        next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_mail_logs (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        message_id INTEGER,
        sender TEXT,
        recipient TEXT,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_autoresponder_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        target_address VARCHAR(255),
        trigger_address VARCHAR(255),
        keyword_trigger TEXT,
        subject_template TEXT,
        response_template TEXT,
        body_template TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS target_address VARCHAR(255);`)
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS keyword_trigger TEXT;`)
    await db.execute(sql`ALTER TABLE pulse_autoresponder_rules ADD COLUMN IF NOT EXISTS response_template TEXT;`)

    schemaInitialized = true
  }

  /**
   * Recupera i messaggi paginati con body sanitizzato per la Webmail
   */
  static async getMessages(optsOrLimit: number | GetMessagesOptions = 50, legacyDirection?: 'INBOUND' | 'OUTBOUND') {
    const db = await getDb()
    if (!db) return { mails: [], unreadCount: 0, total: 0, page: 1, limit: 50 }

    await this.ensureSchema()

    const opts: GetMessagesOptions =
      typeof optsOrLimit === 'number'
        ? { page: 1, limit: optsOrLimit, direction: legacyDirection }
        : optsOrLimit

    const page = Math.max(1, Number(opts.page || 1))
    const limit = Math.min(100, Math.max(1, Number(opts.limit || 50)))
    const offset = (page - 1) * limit
    const direction = opts.direction
    const searchTerm = opts.search?.trim() ? `%${opts.search.trim()}%` : null

    const conditions = []
    if (direction) conditions.push(sql`direction = ${direction}`)
    if (searchTerm) {
      conditions.push(sql`(sender ILIKE ${searchTerm} OR recipient ILIKE ${searchTerm} OR subject ILIKE ${searchTerm})`)
    }

    const whereClause =
      conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``

    const [listRes, countRes, unreadRes] = await Promise.all([
      db.execute(sql`
        SELECT *
        FROM pulse_mail_messages
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM pulse_mail_messages
        ${whereClause};
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS unread
        FROM pulse_mail_messages
        WHERE direction = 'INBOUND' AND (is_read = false OR status = 'UNREAD');
      `)
    ])

    const rows = extractRows(listRes)
    const mails = rows.map((m: any) => ({
      ...m,
      body_html: sanitizeEmailHtml(m.body_html || '')
    }))

    const total = Number(extractRows(countRes)[0]?.total ?? mails.length)
    const unreadCount = Number(extractRows(unreadRes)[0]?.unread ?? 0)

    return { mails, unreadCount, total, page, limit }
  }

  /**
   * Processa una mail in ingresso (Webhook Cloudflare Email Routing)
   */
  static async processInbound(
    sender: string,
    recipient: string,
    subject: string,
    rawHtml: string,
    rawText = ''
  ) {
    const db = await getDb()
    if (!db) throw new Error('Database offline (Pure SQL)')

    await this.ensureSchema()

    const cleanHtml = sanitizeEmailHtml(rawHtml)
    const plainText = rawText || cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    const insertRes: any = await db.execute(sql`
      INSERT INTO pulse_mail_messages (sender, recipient, subject, body_text, body_html, direction, status, is_read)
      VALUES (${sender.trim()}, ${recipient.trim()}, ${subject}, ${plainText}, ${cleanHtml}, 'INBOUND', 'UNREAD', false)
      RETURNING id;
    `)

    const messageId = extractRows(insertRes)[0]?.id ?? null

    await this.logEvent('INBOUND_RECEIVED', messageId, sender, recipient, `Subject: ${subject}`)

    // Esecuzione isolata dell'autoresponder (non blocca il 200 OK al webhook Cloudflare)
    this.triggerAutoresponder(sender, recipient, subject, messageId).catch((err: any) => {
      console.error('⚠️ [AUTORESPONDER NON-BLOCKING ERROR]:', err?.message)
    })

    return { success: true, messageId }
  }

  /**
   * Spedisce una mail in uscita con Retry Queue atomica su errore SMTP
   */
  static async sendOutbound(payload: OutboundPayload) {
    const db = await getDb()
    await this.ensureSchema()

    const cleanHtml = sanitizeEmailHtml(payload.html)
    const plainText = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    try {
      const info = await sendKernelEmail({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: cleanHtml
      })

      let messageId: number | null = null
      if (db) {
        const res: any = await db.execute(sql`
          INSERT INTO pulse_mail_messages (sender, recipient, subject, body_text, body_html, direction, status, is_read, reply_to_id)
          VALUES (${payload.from}, ${payload.to}, ${payload.subject}, ${plainText}, ${cleanHtml}, 'OUTBOUND', 'SENT', true, ${payload.replyToId || null})
          RETURNING id;
        `)
        messageId = extractRows(res)[0]?.id ?? null
      }

      await this.logEvent(
        'OUTBOUND_SENT',
        messageId,
        payload.from,
        payload.to,
        `Inviata via SMTP Relay (ID: ${info?.messageId || 'ok'})`
      )
      return { success: true, queued: false, messageId }
    } catch (err: any) {
      const errMsg = err?.response || err?.message || 'SMTP Failure'
      console.error('❌ [MAIL SERVICE SMTP ERROR]:', errMsg)

      if (db) {
        await db.execute(sql`
          INSERT INTO pulse_mail_queue (sender, recipient, subject, body_html, status, last_error, next_retry_at)
          VALUES (${payload.from}, ${payload.to}, ${payload.subject}, ${cleanHtml}, 'PENDING', ${errMsg}, NOW() + INTERVAL '2 minutes');
        `).catch(() => {})
      }

      await this.logEvent('SMTP_ERROR', null, payload.from, payload.to, `Accodata per retry: ${errMsg}`)
      return { success: false, queued: true, error: errMsg }
    }
  }

  /**
   * Worker Retry Queue Cloud Run Safe (FOR UPDATE SKIP LOCKED multi-pod)
   */
  static async processRetryQueue(batchSize = 10) {
    const db = await getDb()
    if (!db) return { processed: 0, sent: 0, failed: 0 }

    await this.ensureSchema()

    const claimedRes: any = await db.execute(sql`
      WITH locked_rows AS (
        SELECT id
        FROM pulse_mail_queue
        WHERE status = 'PENDING'
          AND attempts < COALESCE(max_attempts, 3)
          AND next_retry_at <= CURRENT_TIMESTAMP
        ORDER BY next_retry_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE pulse_mail_queue q
      SET status = 'PROCESSING',
          attempts = COALESCE(q.attempts, 0) + 1
      FROM locked_rows
      WHERE q.id = locked_rows.id
      RETURNING q.*;
    `)

    const rows = extractRows(claimedRes)
    let sent = 0
    let failed = 0

    for (const item of rows) {
      const currentAttempt = Number(item.attempts || 1)
      const maxAttempts = Number(item.max_attempts || 3)

      try {
        await sendKernelEmail({
          from: item.sender,
          to: item.recipient,
          subject: item.subject,
          html: item.body_html
        })

        await db.execute(sql`UPDATE pulse_mail_queue SET status = 'SENT', last_error = NULL WHERE id = ${item.id};`)
        await this.logEvent('RETRY_SUCCESS', null, item.sender, item.recipient, `Inviata al tentativo #${currentAttempt}`)
        sent++
      } catch (retryErr: any) {
        const errMsg = retryErr?.response || retryErr?.message || 'Retry SMTP error'
        const exhausted = currentAttempt >= maxAttempts
        const nextStatus = exhausted ? 'FAILED' : 'PENDING'
        const backoffMinutes = currentAttempt * 5

        await db.execute(sql`
          UPDATE pulse_mail_queue
          SET status = ${nextStatus},
              last_error = ${errMsg},
              next_retry_at = NOW() + (${backoffMinutes} * INTERVAL '1 minute')
          WHERE id = ${item.id};
        `)
        await this.logEvent(
          exhausted ? 'RETRY_EXHAUSTED' : 'RETRY_FAILED',
          null,
          item.sender,
          item.recipient,
          `Tentativo #${currentAttempt}/${maxAttempts} fallito: ${errMsg}`
        )
        failed++
      }
    }

    return { processed: rows.length, sent, failed }
  }

  /**
   * Autoresponder con protezione anti-loop e compatibilità colonne v2.4/v2.6
   */
  private static async triggerAutoresponder(
    sender: string,
    recipient: string,
    incomingSubject: string,
    replyToId: number | null = null
  ) {
    const cleanSender = sender.trim().toLowerCase()
    const cleanRecipient = recipient.trim().toLowerCase()

    if (
      !cleanSender ||
      cleanSender === cleanRecipient ||
      /^(no-?reply|mailer-daemon|postmaster|bounce|notifications?)@/i.test(cleanSender) ||
      /^\[auto-reply\]/i.test(incomingSubject.trim())
    ) {
      return
    }

    const db = await getDb()
    if (!db) return

    const rulesRes: any = await db.execute(sql`
      SELECT *
      FROM pulse_autoresponder_rules
      WHERE is_active = true
        AND LOWER(COALESCE(target_address, trigger_address, '')) = ${cleanRecipient};
    `)
    const rules = extractRows(rulesRes)

    for (const rule of rules) {
      const matchKey = rule.keyword_trigger
        ? incomingSubject.toLowerCase().includes(String(rule.keyword_trigger).toLowerCase())
        : true

      if (matchKey) {
        const rawTemplate = rule.response_template || rule.body_template || ''
        const autoHtml = `
          <div style="font-family: sans-serif; background: #020420; color: #f8fafc; padding: 20px; border-radius: 10px;">
            <h2 style="color: #00dc82; margin-top: 0;">⚡ DevKernelPulse Nexus</h2>
            <div>${sanitizeEmailHtml(rawTemplate)}</div>
            <hr style="border-color: #1e293b; margin: 16px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Messaggio automatico generato da DKP Mail Engine v2.6-PURE-SQL.</p>
          </div>
        `
        const autoSubject = `[Auto-Reply] Re: ${incomingSubject}`

        await sendKernelEmail({
          from: recipient,
          to: sender,
          subject: autoSubject,
          html: autoHtml,
          headers: {
            'Auto-Submitted': 'auto-replied',
            'X-Auto-Response-Suppress': 'All'
          }
        })

        await db.execute(sql`
          INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status, is_read, reply_to_id)
          VALUES (${recipient}, ${sender}, ${autoSubject}, ${autoHtml}, 'OUTBOUND', 'SENT', true, ${replyToId});
        `)

        await this.logEvent('AUTO_RESPONDED', replyToId, recipient, sender, `Triggered rule ID: ${rule.id}`)
      }
    }
  }

  private static async logEvent(
    type: string,
    messageId: number | null,
    sender: string,
    recipient: string,
    details: string
  ) {
    try {
      const db = await getDb()
      if (!db) return
      await db.execute(sql`
        INSERT INTO pulse_mail_logs (event_type, message_id, sender, recipient, details)
        VALUES (${type}, ${messageId}, ${sender}, ${recipient}, ${details});
      `)
    } catch (err: any) {
      console.warn('⚠️ [MAIL LOG WARNING]:', err?.message)
    }
  }
}