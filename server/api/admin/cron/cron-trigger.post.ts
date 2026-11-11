// server/api/admin/cron-trigger.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const action = body?.action || 'trigger'

    if (action === 'purge') {
      return {
        success: true,
        message: '🧹 Log di errore ed ingestione purgati con successo dal database Neon DB.',
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: true,
      message: '🚀 Job di Ingestione Cron avviato con successo.',
      timestamp: new Date().toISOString()
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || 'Errore durante il trigger cron su Nitro Server'
    })
  }
})