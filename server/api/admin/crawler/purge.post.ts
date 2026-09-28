// server/api/admin/crawler/purge.post.ts
import { DKPCrawlerEngine } from '~~/server/utils/dkp-crawler/engine'

export default defineEventHandler(async (event) => {
  try {
    const result = await DKPCrawlerEngine.purge()
    return result
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante la pulizia del database'
    })
  }
})