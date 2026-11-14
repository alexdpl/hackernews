// server/api/newsletter/broadcast.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { NewsletterService } from '~~/server/services/newsletter.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const body = await readBody(event)
  const subject = String(body?.subject || '').trim()
  const contentHtml = String(body?.contentHtml || '').trim()
  const targetSegment = body?.targetSegment === 'TEST_ADMIN' ? 'TEST_ADMIN' : 'SUBSCRIBED_ONLY'

  if (!subject || !contentHtml) {
    throw createError({ statusCode: 400, statusMessage: 'Oggetto e contenuto HTML obbligatori.' })
  }

  return await NewsletterService.sendBroadcast(subject, contentHtml, targetSegment)
})