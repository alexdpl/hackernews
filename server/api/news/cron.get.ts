// server/api/news/cron.get.ts
import { defineEventHandler, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  return {
    debug: true,
    receivedTokenLength: token.length,
    receivedTokenPreview: token.slice(0, 5) + '...',
    envCronExists: Boolean(process.env.CRON_SECRET),
    envCronLength: String(process.env.CRON_SECRET || '').length,
    configCronExists: Boolean(config.cronSecret),
    match: token === String(config.cronSecret || process.env.CRON_SECRET || '').trim()
  }
})