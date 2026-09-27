// server/api/admin/mail/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = getDb()
    if (!db) return { success: false, unreadCount: 0, mails: [] }

    // Tabella per sicurezza
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

    const mailsResult: any = await db.execute(sql`
      SELECT * FROM pulse_mail_messages ORDER BY created_at DESC LIMIT 50;
    `)
    const mails = Array.isArray(mailsResult) ? mailsResult : (mailsResult?.rows || [])

    const unreadResult: any = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM pulse_mail_messages WHERE status = 'UNREAD' AND direction = 'INBOUND';
    `)
    const unreadRow = Array.isArray(unreadResult) ? unreadResult[0] : (unreadResult?.rows?.[0] || null)

    return {
      success: true,
      unreadCount: unreadRow?.count || 0,
      mails
    }
  } catch (err: any) {
    return { success: false, unreadCount: 0, mails: [], error: err.message }
  }
})