// server/api/newsletter/subscribers.get.ts
import { defineEventHandler } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { NewsletterService } from '~~/server/services/newsletter.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)
  const data = await NewsletterService.listSubscribers()
  return { success: true, data }
})