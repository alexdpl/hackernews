// server/api/autoresponder/rules.get.ts
import { defineEventHandler } from 'h3'
import { requireMailAdmin } from '~~/server/utils/mail-auth'
import { AutoresponderService } from '~~/server/services/autoresponder.service'

export default defineEventHandler(async (event) => {
  requireMailAdmin(event)
  const data = await AutoresponderService.listRules()
  return { success: true, data }
})