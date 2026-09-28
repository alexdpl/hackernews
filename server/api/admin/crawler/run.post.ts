// server/api/admin/crawler/run.post.ts
import { DKPCrawlerEngine } from '~~/server/utils/dkp-crawler/engine'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    
    // Esecuzione delegata interamente al plugin isolato DKP Crawler
    const result = await DKPCrawlerEngine.run({
      section: body?.section || body?.type || 'news',
      limit: parseInt(body?.limit) || 5
    })

    return result
  } catch (err: any) {
    console.error('[CRAWLER API ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante l\'esecuzione del DKP Crawler Plugin'
    })
  }
})