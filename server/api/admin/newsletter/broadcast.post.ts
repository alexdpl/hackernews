// server/api/admin/newsletter/broadcast.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendKernelEmail } from '~~/server/utils/mailer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const { subject, html, sender } = body

    if (!subject || !html) {
      throw createError({ statusCode: 400, statusMessage: 'Oggetto e contenuto HTML sono obbligatori' })
    }

    const db = getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'DB non disponibile' })

    // Recupera tutti gli iscritti ATTIVI
    const res: any = await db.execute(sql`
      SELECT email FROM pulse_subscribers WHERE status = 'ACTIVE';
    `)
    const activeSubscribers = Array.isArray(res) ? res : (res?.rows || [])

    if (activeSubscribers.length === 0) {
      return { success: false, error: 'Nessun iscritto attivo a cui inviare la newsletter.' }
    }

    const fromAddress = sender || 'newsletter@devkernelpulse.org'
    let sentCount = 0
    let failCount = 0

    // Ciclo di invio massivo resiliente
    for (const sub of activeSubscribers) {
      try {
        await sendKernelEmail({
          from: fromAddress,
          to: sub.email,
          subject,
          html
        })

        // Log invio nel DB Mail Messages
        await db.execute(sql`
          INSERT INTO pulse_mail_messages (sender, recipient, subject, body_html, direction, status)
          VALUES (${fromAddress}, ${sub.email}, ${subject}, ${html}, 'OUTBOUND', 'SENT');
        `)
        sentCount++
      } catch (err) {
        failCount++
      }
    }

    return {
      success: true,
      sentCount,
      failCount,
      totalTarget: activeSubscribers.length
    }
  } catch (error: any) {
    console.error('💥 [BROADCAST ERROR]:', error)
    return { success: false, error: error.message }
  }
})