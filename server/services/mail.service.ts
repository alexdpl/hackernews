// server/services/mail.service.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendKernelEmail } from '~~/server/utils/mailer'

export class MailService {
  static async getMessages(limit = 50) {
    const db = getDb()
    if (!db) return []
    const res: any = await db.execute(sql`
      SELECT * FROM pulse_mail_messages ORDER BY created_at DESC LIMIT ${limit};
    `)
    return Array.isArray(res) ? res : (res?.rows || [])
  }

  static async sendOutbound(from: string, to: string, subject: string, html: string, replyToId?: number) {
    await sendKernelEmail({ from, to, subject, html })
    const db = getDb()
    if (db) {
      await db.execute(sql`
        INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status, reply_to_id)
        VALUES (${from}, ${to}, ${subject}, ${html}, 'OUTBOUND', 'SENT', ${replyToId || null});
      `)
    }
    return true
  }
}
🚀 Sigillo Finale & Deploy v2.4 su GCP:
Esegui il commit finale per chiudere ufficialmente la versione 2.4:

PowerShell
git add .
git commit -m "feat(kernel