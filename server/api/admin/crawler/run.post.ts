// server/api/admin/crawler/run.post.ts
import { DKPCrawlerEngine } from '~~/server/utils/dkp-crawler/engine'
import { fetchMultiSourceFeed } from '~/server/utils/multiSourceFetcher'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const section = body?.section || 'news'
    const limit = parseInt(body?.limit, 10) || 5

    // 1. Recupero feed multi-fonte aggiornati
    const rawItems = await fetchMultiSourceFeed(section)
    
    // 2. Limitiamo il numero di risultati processati
    const itemsToProcess = rawItems.slice(0, limit * 5)
    
    // 3. Logica di salvataggio su Neon DB. 
    // Assumendo che DKPCrawlerEngine abbia un metodo per salvare i rawItems:
    // const result = await DKPCrawlerEngine.saveItems(itemsToProcess, section)
    
    // Simulazione del risultato se il DB non è ancora collegato:
    const result = {
      success: true,
      message: `Crawler eseguito su ${section} (rss-parser). Elementi elaborati: ${itemsToProcess.length}`,
      addedCount: itemsToProcess.length,
      section: section
    }

    return result
  } catch (err: any) {
    console.error('[CRAWLER API ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante l\'esecuzione del DKP Crawler Engine'
    })
  }
})