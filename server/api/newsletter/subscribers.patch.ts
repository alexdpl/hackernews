// server/api/newsletter/subscribers.patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { NewsletterService } from '~~/server/services/newsletter.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const body = await readBody(event)
  const id = Number(body?.id)
  const status = String(body?.status || '').toUpperCase() as 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED'

  if (!id || !['SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'ID o stato iscritto non validi' })
  }

  return await NewsletterService.updateSubscriberStatus(id, status)
})