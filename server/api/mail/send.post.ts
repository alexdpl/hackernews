// server/api/mail/send.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { MailService } from '~~/server/services/mail.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const body = await readBody(event)
  if (!body?.to || !body?.subject || !body?.html) {
    throw createError({ statusCode: 400, statusMessage: 'Destinatario, oggetto e testo sono obbligatori.' })
  }

  return await MailService.sendOutbound({
    from: body.from || 'info@devkernelpulse.org',
    to: String(body.to).trim(),
    subject: String(body.subject).trim(),
    html: String(body.html),
    replyToId: body.replyToId ? Number(body.replyToId) : undefined
  })
})