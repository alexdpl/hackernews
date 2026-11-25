// server/api/admin/sentinels.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sendSentinelEmail } from '~~/server/utils/mailer'
import { runSentinelSweep } from '~~/server/utils/sentinelNetwork'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Accesso riservato al Kernel Admin.' })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })

  if (body.action === 'unban' && body.userId) {
    await db.execute(sql`
      UPDATE users
      SET is_shadowbanned = FALSE, ban_reason = NULL, banned_until = NULL
      WHERE id = ${Number(body.userId)};
    `)
    return { success: true, message: 'Shadowban revocato.' }
  }

  if (body.action === 'test_smtp') {
    const sent = await sendSentinelEmail({
      to: String(body.to || user.email || 'alex@devkernelpulse.org'),
      subject: 'Test Telemetria SMTP DKP Sentinel Network',
      category: 'security_alert',
      recipientUsername: user.username || 'alexdpl',
      sentinelName: 'sentinel_ai',
      headline: 'Canale SMTP Operativo',
      bodyMarkdown: 'Connessione SMTP verificata dal Kernel Control Plane.',
      actionUrl: '[https://devkernelpulse.org](https://devkernelpulse.org)'
    })
    return { success: sent, message: sent ? 'Email inviata con successo.' : 'Invio SMTP fallito: controlla le variabili SMTP_*.' }
  }

  if (body.action === 'run_sweep') {
    const result = await runSentinelSweep({
      recipientEmail: String(body.to || user.email || 'alex@devkernelpulse.org'),
      triggerSource: 'admin-manual-sweep'
    })
    return {
      ...result,
      message: `Scan completato (${result.scannedCount} contenuti, ${result.findingsCount} alert). Report inviato nella casella di posta.`
    }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non valida.' })
})
