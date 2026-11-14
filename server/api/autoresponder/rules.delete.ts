// server/api/autoresponder/rules.delete.ts
import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { AutoresponderService } from '~~/server/services/autoresponder.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)

  const query = getQuery(event)
  let id = Number(query?.id)

  if (!id) {
    const body = await readBody(event).catch(() => null)
    id = Number(body?.id)
  }

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID regola mancante.' })
  }

  return await AutoresponderService.deleteRule(id)
})