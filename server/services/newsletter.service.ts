// server/services/newsletter.service.ts
import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { MailService } from '~~/server/services/mail.service'
import { sanitizeEmailHtml } from '~~/server/utils/sanitizer'

let newsletterSchemaReady = false

function extractRows(res: any): any[] {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.rows)) return res.rows
  return []
}

export class NewsletterService {
  /**
   * Auto-migrazione idempotente Pure SQL (compatibile con record legacy pulse_subscribers)
   */
  static async ensureSchema() {
    if (newsletterSchemaReady) return
    const db = await getDb()
    if (!db) return

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100) DEFAULT '',
        status VARCHAR(30) NOT NULL DEFAULT 'SUBSCRIBED',
        source VARCHAR(80) DEFAULT 'WEB',
        unsubscribe_token VARCHAR(120),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await db.execute(sql`ALTER TABLE pulse_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(120);`)
    await db.execute(sql`ALTER TABLE pulse_subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`)

    // Normalizza eventuali record legacy 'ACTIVE' in 'SUBSCRIBED'
    await db.execute(sql`
      UPDATE pulse_subscribers SET status = 'SUBSCRIBED' WHERE UPPER(status) = 'ACTIVE';
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_newsletter_campaigns (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        target_segment VARCHAR(50) NOT NULL DEFAULT 'SUBSCRIBED_ONLY',
        total_targets INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    newsletterSchemaReady = true
  }

  /**
   * Iscrizione pubblica con upsert GDPR e mail di conferma via MailService
   */
  static async subscribe(rawEmail: string, rawName = '', rawSource = 'WEB') {
    const email = rawEmail.trim().toLowerCase()
    const name = rawName.trim()
    const source = (rawSource || 'WEB').trim().toUpperCase()
    const token = randomUUID()

    const db = await getDb()
    if (!db) throw new Error('Database offline (Pure SQL)')

    await this.ensureSchema()

    await db.execute(sql`
      INSERT INTO pulse_subscribers (email, name, source, status, unsubscribe_token, updated_at)
      VALUES (${email}, ${name}, ${source}, 'SUBSCRIBED', ${token}, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        status = 'SUBSCRIBED',
        name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE pulse_subscribers.name END,
        source = COALESCE(NULLIF(EXCLUDED.source, ''), pulse_subscribers.source),
        unsubscribe_token = COALESCE(pulse_subscribers.unsubscribe_token, EXCLUDED.unsubscribe_token),
        updated_at = CURRENT_TIMESTAMP;
    `)

    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.org'
    const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`

    // Invio email di benvenuto non bloccante
    MailService.sendOutbound({
      from: 'newsletter@devkernelpulse.org',
      to: email,
      subject: '⚡ Benvenuto nel Digest DevKernelPulse v2.6',
      html: `
        <div style="font-family: sans-serif; background: #020420; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #00dc82; margin-top: 0;">⚡ Iscrizione Confermata — DevKernelPulse</h2>
          <p>Ciao${name ? ` <strong>${name}</strong>` : ''},</p>
          <p>Il tuo indirizzo <strong>${email}</strong> è ora registrato sul canale aggiornamenti tecnici e release del Kernel DKP.</p>
          <hr style="border-color: #1e293b; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            Non vuoi più ricevere questi aggiornamenti?
            <a href="${unsubUrl}" style="color: #38bdf8;">Disiscriviti con un click</a>.
          </p>
        </div>
      `
    }).catch((err: any) => {
      console.warn('⚠️ [NEWSLETTER WELCOME MAIL WARN]:', err?.message)
    })

    return { success: true, email, status: 'SUBSCRIBED' }
  }

  /**
   * Disiscrizione pubblica tramite token o email
   */
  static async unsubscribe(tokenOrEmail: string) {
    const clean = tokenOrEmail.trim()
    if (!clean) return false

    const db = await getDb()
    if (!db) return false

    await this.ensureSchema()

    const res: any = clean.includes('@')
      ? await db.execute(sql`
          UPDATE pulse_subscribers
          SET status = 'UNSUBSCRIBED', updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(email) = ${clean.toLowerCase()}
          RETURNING id;
        `)
      : await db.execute(sql`
          UPDATE pulse_subscribers
          SET status = 'UNSUBSCRIBED', updated_at = CURRENT_TIMESTAMP
          WHERE unsubscribe_token = ${clean}
          RETURNING id;
        `)

    return extractRows(res).length > 0
  }

  /**
   * Lista iscritti per la dashboard Admin
   */
  static async listSubscribers() {
    const db = await getDb()
    if (!db) return []

    await this.ensureSchema()

    const res: any = await db.execute(sql`
      SELECT
        id,
        email,
        name,
        CASE WHEN UPPER(status) = 'ACTIVE' THEN 'SUBSCRIBED' ELSE UPPER(status) END AS status,
        COALESCE(source, 'WEB') AS source,
        created_at
      FROM pulse_subscribers
      ORDER BY created_at DESC
      LIMIT 1000;
    `)

    return extractRows(res)
  }

  /**
   * Aggiorna stato singolo iscritto da pannello Admin
   */
  static async updateSubscriberStatus(id: number, status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED') {
    const db = await getDb()
    if (!db) throw new Error('Database offline (Pure SQL)')

    await this.ensureSchema()

    await db.execute(sql`
      UPDATE pulse_subscribers
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `)
    return { success: true }
  }

  /**
   * Invio campagna Broadcast con footer GDPR personalizzato per destinatario
   */
  static async sendBroadcast(
    subject: string,
    rawHtml: string,
    targetSegment: 'SUBSCRIBED_ONLY' | 'TEST_ADMIN' = 'SUBSCRIBED_ONLY'
  ) {
    const db = await getDb()
    await this.ensureSchema()

    const cleanBody = sanitizeEmailHtml(rawHtml)
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.org'

    let targets: Array<{ email: string; token: string | null }> = [
      { email: 'admin@devkernelpulse.org', token: null }
    ]

    if (targetSegment === 'SUBSCRIBED_ONLY' && db) {
      const res: any = await db.execute(sql`
        SELECT email, unsubscribe_token
        FROM pulse_subscribers
        WHERE UPPER(status) IN ('SUBSCRIBED', 'ACTIVE');
      `)
      const rows = extractRows(res)
      if (rows.length > 0) {
        targets = rows.map((r: any) => ({
          email: r.email,
          token: r.unsubscribe_token || null
        }))
      }
    }

    let sentCount = 0

    for (const target of targets) {
      const unsubLink = target.token
        ? `${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(target.token)}`
        : `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(target.email)}`

      const fullHtml = `
        <div style="font-family: sans-serif; background: #020420; color: #f8fafc; padding: 24px; border-radius: 12px;">
          ${cleanBody}
          <hr style="border-color: #1e293b; margin: 24px 0 14px;" />
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            Ricevi questa email perché sei iscritto a DevKernelPulse.org ·
            <a href="${unsubLink}" style="color: #38bdf8;">Disiscriviti</a>
          </p>
        </div>
      `

      const result = await MailService.sendOutbound({
        from: 'newsletter@devkernelpulse.org',
        to: target.email,
        subject,
        html: fullHtml
      })

      if (result.success || result.queued) {
        sentCount++
      }
    }

    if (db) {
      await db.execute(sql`
        INSERT INTO pulse_newsletter_campaigns (subject, target_segment, total_targets, sent_count)
        VALUES (${subject}, ${targetSegment}, ${targets.length}, ${sentCount});
      `).catch(() => {})
    }

    return {
      success: true,
      sentCount,
      totalTargets: targets.length
    }
  }
}