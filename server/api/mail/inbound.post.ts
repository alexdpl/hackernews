// server/api/mail/inbound.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { MailService } from '~~/server/services/mail.service'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { secret, sender, recipient, subject, text, html } = body

  const expectedSecret = process.env.MAIL_WEBHOOK_SECRET || 'dkp-secret-key-2026'
  if (secret !== expectedSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized Webhook Access' })
  }

  if (!sender || !recipient || !subject) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required mail fields' })
  }

  const res = await MailService.processInbound(
    String(sender),
    String(recipient),
    String(subject),
    String(html || text || ''),
    String(text || '')
  )

  return { success: true, mailId: res.messageId }
})