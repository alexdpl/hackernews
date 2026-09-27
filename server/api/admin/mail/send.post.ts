// server/api/admin/mail/send.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendKernelEmail } from '~~/server/utils/mailer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const { from, to, subject, html, replyToId } = body

    if (!from || !to || !subject || !html) {
      throw createError({ statusCode: 400, statusMessage: 'Tutti i campi sono obbligatori' })
    }

    // 1. Invio SMTP
    await sendKernelEmail({ from, to, subject, html })

    // 2. Salvataggio su DB Neon
    const db = getDb()
    if (db) {
      await db.execute(sql`
        INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status, reply_to_id)
        VALUES (${from}, ${to}, ${subject}, ${html}, 'OUTBOUND', 'SENT', ${replyToId || null});
      `)
    }

    return { success: true }
  } catch (error: any) {
    console.error('💥 [SEND MAIL ERROR]:', error)
    return { success: false, error: error.message }
  }
})