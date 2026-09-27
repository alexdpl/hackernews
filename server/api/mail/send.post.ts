import { MailService } from '~~/server/services/mail.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.to || !body.subject || !body.html) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri incompleti' })
  }

  const result = await MailService.sendOutbound({
    from: body.from || 'info@devkernelpulse.org',
    to: body.to,
    subject: body.subject,
    html: body.html,
    replyToId: body.replyToId
  })

  return result
})