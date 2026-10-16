// server/api/admin/crawler/run-all.post.ts
import { runEngineNews, runEngineAsk, runEngineShow, runEngineJobs } from '~~/server/utils/crawlerEngines'

export default defineEventHandler(async (event) => {
  try {
    console.log('🤖 Avvio sincronizzazione multi-engine DKP v2.5-GOLD...')

    const results = await Promise.all([
      runEngineNews(),
      runEngineAsk(),
      runEngineShow(),
      runEngineJobs()
    ])

    const totalImported = results.reduce((acc, curr) => acc + (curr.imported || 0), 0)

    return {
      success: true,
      message: `Sincronizzazione completata con successo! Totale elementi acquisiti: ${totalImported}`,
      details: results
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Errore durante l\'esecuzione dei sub-engines' })
  }
})