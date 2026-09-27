// server/api/mail/inbound.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const { secret, sender, recipient, subject, text, html } = body

    const expectedSecret = process.env.MAIL_WEBHOOK_SECRET || 'dkp-secret-key-2026'
    if (secret !== expectedSecret) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized Webhook Access' })
    }

    if (!sender || !recipient || !subject) {
      throw createError({ statusCode: 400, statusMessage: 'Missing required mail fields' })
    }

    const db = getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database connection failed' })
    }

    // 1. Auto-Migration Resiliente (SQL Native)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_mail_messages (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body_text TEXT,
        body_html TEXT,
        direction VARCHAR(20) DEFAULT 'INBOUND',
        status VARCHAR(20) DEFAULT 'UNREAD',
        is_starred BOOLEAN DEFAULT FALSE,
        reply_to_id INT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        source VARCHAR(50) DEFAULT 'WEB',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

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

    // 2. Inserimento Mail in Ingresso
    const insertResult: any = await db.execute(sql`
      INSERT INTO pulse_mail_messages (sender, recipient, subject, body_text, body_html, direction, status)
      VALUES (${sender}, ${recipient}, ${subject}, ${text || ''}, ${html || text || ''}, 'INBOUND', 'UNREAD')
      RETURNING id;
    `)

    const mailId = insertResult?.[0]?.id || insertResult?.rows?.[0]?.id || null

    // 3. Verifica Autoresponder
    const autoRules: any = await db.execute(sql`
      SELECT * FROM pulse_autoresponder_rules 
      WHERE trigger_address = ${recipient} AND is_active = true 
      LIMIT 1;
    `)
    const autoRule = Array.isArray(autoRules) ? autoRules[0] : (autoRules?.rows?.[0] || null)

    if (autoRule) {
      const autoReplySubject = `Re: ${subject}`
      const autoReplyBody = `
        <div style="font-family: sans-serif; background: #020420; color: #f8fafc; padding: 20px; border-radius: 10px;">
          <h2 style="color: #00dc82;">⚡ DevKernelPulse Nexus</h2>
          <p>Grazie per averci contattato! Abbiamo ricevuto la tua richiesta a <strong>${recipient}</strong>.</p>
          <hr style="border-color: #1e293b;" />
          <div>${autoRule.body_template}</div>
          <br/>
          <p style="font-size: 0.8em; color: #94a3b8;">Messaggio generato automaticamente dal Kernel v2.4 Mail Engine.</p>
        </div>
      `

      try {
        await sendKernelEmail({
          from: recipient,
          to: sender,
          subject: autoReplySubject,
          html: autoReplyBody,
        })

        await db.execute(sql`
          INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status, reply_to_id)
          VALUES (${recipient}, ${sender}, ${autoReplySubject}, ${autoReplyBody}, 'OUTBOUND', 'SENT', ${mailId});
        `)
      } catch (err) {
        console.warn('⚠️ [AUTORESPONDER WARN]:', err)
      }
    }

    return { success: true, mailId }
  } catch (error: any) {
    console.error('💥 [INBOUND MAIL ERROR]:', error)
    return { success: false, error: error.message }
  }
})