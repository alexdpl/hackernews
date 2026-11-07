// server/api/admin/crawler.ts
import { defineEventHandler, createError } from 'h3'
// Importiamo le funzioni dal TUO crawlerEngines (che gestiscono nativamente Pure SQL)
import { runEngineNews, runEngineAsk, runEngineShow, runEngineJobs } from '~~/server/utils/crawlerEngines'

export default defineEventHandler(async (event) => {
  try {
    const limit = 5 // Limite per engine (modificabile)
    const results = []

    // 1. Esegui il crawler News (Dev.to + HackerNews)
    const newsResult = await runEngineNews(limit)
    results.push(newsResult)

    // 2. Esegui il crawler Ask (HackerNews Ask)
    const askResult = await runEngineAsk(limit)
    results.push(askResult)

    // 3. Esegui il crawler Show (GitHub Repos)
    const showResult = await runEngineShow(limit)
    results.push(showResult)

    // 4. Esegui il crawler Jobs (RemoteOK)
    const jobsResult = await runEngineJobs(limit)
    results.push(jobsResult)

    const totalImported = results.reduce((acc, curr) => acc + (curr.imported || 0), 0)

    return {
      success: true,
      message: totalImported > 0 
        ? `Sync completato con successo! Importate ${totalImported} nuove storie dai motori multifonte.`
        : `Sync completato. Tutte le ultime storie erano già presenti nel DB.`,
      stats: results
    }

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Errore nell'esecuzione dei crawler engine: ${error.message}`
    })
  }
})