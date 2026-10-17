// server/api/admin/crawler/run.post.ts
import { fetchMultiSourceFeed } from '~~/server/utils/multiSourceFetcher'
import { getDb } from '~~/server/utils/db'
import { pulseStories } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const section = body?.section || 'news'
    const limit = parseInt(body?.limit, 10) || 20 // Supporta fino a 50+ elementi a seconda della scelta

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })
    }

    // 1. Recupero feed multi-fonte mirati per la sezione scelta (news, ask, show, jobs)
    const rawItems = await fetchMultiSourceFeed(section)
    
    // Tagliamo in base al moltiplicatore e al limite richiesto dall'utente (es. limit 50 prende un blocco corposo)
    const maxToProcess = limit * 10
    const itemsToProcess = rawItems.slice(0, maxToProcess)

    let savedCount = 0

    // 2. Inserimento dinamico nel database Neon DB con la sezione corretta
    for (const item of itemsToProcess) {
      try {
        await db.insert(pulseStories).values({
          title: item.title,
          url: item.link,
          domain: item.sourceName || 'RSS Feed',
          type: section, // Salva correttamente 'news', 'ask', 'show' o 'jobs'
          author: item.author || 'Community',
          points: 1,
          commentsCount: 0,
          xpAwarded: 10
        }).onConflictDoNothing() // Salta duplicati senza bloccare

        savedCount++
      } catch (dbErr) {
        // Ignora singoli errori di scrittura duplicati
      }
    }

    return {
      success: true,
      message: `Crawler eseguito con successo su "${section.toUpperCase()}". Caricati ${savedCount} elementi freschi nel DB!`,
      addedCount: savedCount,
      section: section
    }
  } catch (err: any) {
    console.error('[CRAWLER API ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante l\'esecuzione del DKP Crawler Engine'
    })
  }
})