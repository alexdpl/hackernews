// server/api/mail/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { MailService } from '~~/server/services/mail.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const query = getQuery(event)
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 50)
  const direction = query.direction === 'INBOUND' || query.direction === 'OUTBOUND' ? query.direction : undefined
  const search = typeof query.search === 'string' ? query.search : undefined

  const data = await MailService.getMessages({ page, limit, direction, search })
  return { success: true, ...data }
})