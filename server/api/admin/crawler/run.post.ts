// server/api/admin/crawler/run.post.ts
import { DKPCrawlerEngine } from '~~/server/utils/dkp-crawler/engine'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const section = body?.section || 'news'
    const limit = parseInt(body?.limit, 10) || 5

    // Esecuzione delegata alla classe ufficiale del crawler
    const result = await DKPCrawlerEngine.run({
      section: section,
      limit: limit
    })

    return result
  } catch (err: any) {
    console.error('[CRAWLER API ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante l\'esecuzione del DKP Crawler Engine'
    })
  }
})