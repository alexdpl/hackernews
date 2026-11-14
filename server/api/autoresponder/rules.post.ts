// server/api/autoresponder/rules.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { AutoresponderService } from '~~/server/services/autoresponder.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const body = (await readBody(event)) || {}
  const targetAddress = String(body.targetAddress || body.target_address || '').trim()
  const keywordTrigger = String(body.triggerKeyword || body.keyword_trigger || '').trim()
  const responseTemplate = String(body.responseTemplate || body.response_template || '').trim()
  const isActive = body.isActive ?? body.is_active ?? true

  if (!targetAddress || !targetAddress.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Indirizzo casella target non valido.' })
  }

  if (!responseTemplate) {
    throw createError({ statusCode: 400, statusMessage: 'Il template di risposta è obbligatorio.' })
  }

  const created = await AutoresponderService.createRule({
    targetAddress,
    keywordTrigger: keywordTrigger || null,
    responseTemplate,
    isActive: Boolean(isActive)
  })

  return { success: true, data: created }
})