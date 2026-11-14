// server/api/autoresponder/rules.patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { AutoresponderService } from '~~/server/services/autoresponder.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const body = (await readBody(event)) || {}
  const id = Number(body.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID regola mancante.' })
  }

  const isActive = Boolean(body.isActive ?? body.is_active)
  return await AutoresponderService.toggleRule(id, isActive)
})