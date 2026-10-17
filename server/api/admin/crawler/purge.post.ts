// server/api/admin/crawler/purge.post.ts
import { DKPCrawlerEngine } from '~~/server/utils/dkp-crawler/engine'
import { fetchMultiSourceFeed } from '~/server/utils/multiSourceFetcher'

export default defineEventHandler(async (event) => {
  try {
    console.log('🤖 Avvio sincronizzazione multi-engine DKP v2.5-GOLD (RSS Parser)...')

    const sections = ['news', 'ask', 'show', 'jobs']
    let totalImported = 0
    const details = []

    for (const section of sections) {
      const items = await fetchMultiSourceFeed(section)
      // const savedCount = await DKPCrawlerEngine.saveItems(items, section)
      const savedCount = items.length // Mock per simulare il DB
      
      totalImported += savedCount
      details.push({ section, imported: savedCount })
    }

    return {
      success: true,
      message: `Sincronizzazione completata con successo! Totale elementi acquisiti: ${totalImported}`,
      details: details
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Errore durante l\'esecuzione dei sub-engines' })
  }
})