// server/api/news/[slug].get.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const param = event.context.params?.slug
    if (!param) {
      throw createError({ statusCode: 400, statusMessage: 'Parametro slug mancante' })
    }
    
    const cleanParam = decodeURIComponent(param).trim()

    // 🛑 FIX ROUTE COLLISION: Escludiamo parole chiave di sistema 
    // che non sono mai slug di una singola notizia.
    const reservedKeywords = ['stream', 'comments', 'latest', 'popular', 'trending']
    if (reservedKeywords.includes(cleanParam.toLowerCase())) {
       // Se è una parola riservata, non lanciare un errore 500, ma passa silente 
       // oppure lancia un 404 specifico gestito in modo pulito senza fare query DB.
       return {
         success: false,
         message: `La rotta /api/news/${cleanParam} è riservata o deve essere gestita da un file specifico (es. stream.get.ts)`
       }
    }
    
    // 🔍 Estrazione intelligente dell'ID numerico dalla fine dello slug
    const parts = cleanParam.split('-')
    const possibleIdStr = parts[parts.length - 1] || cleanParam
    const possibleId = !isNaN(Number(possibleIdStr)) ? Number(possibleIdStr) : -1

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    let rows: any[] = []

    // 1. Interroghiamo hn_stories (La tabella prioritaria)
    try {
      const resHn = await db.execute(sql`
        SELECT 
          id,
          hn_id,
          title,
          COALESCE(slug, CONCAT('story-', hn_id)) AS slug,
          url,
          score AS points,
          by AS author,
          type,
          text,
          created_at AS "createdAt"
        FROM hn_stories
        WHERE slug = ${cleanParam} 
           OR id = ${possibleId}
           OR hn_id = ${possibleId}
        LIMIT 1
      `)
      rows = resHn.rows || resHn || []
    } catch (e) {
      console.warn('Fallback: hn_stories non trovato, passo a pulse_stories')
    }

    // 2. Fallback su pulse_stories se la prima tabella è vuota
    if (!rows || rows.length === 0) {
      try {
        const resPulse = await db.execute(sql`
          SELECT 
            id,
            id AS hn_id,
            title,
            COALESCE(slug, CONCAT('story-', id)) AS slug,
            url,
            points,
            author,
            type,
            created_at AS "createdAt"
          FROM pulse_stories
          WHERE slug = ${cleanParam} 
             OR id = ${possibleId}
          LIMIT 1
        `)
        rows = resPulse.rows || resPulse || []
      } catch (e) {
        // Ignora
      }
    }

    // 3. Verifica finale
    if (!rows || rows.length === 0) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: `Notizia non trovata per il parametro: ${cleanParam}` 
      })
    }

    const item = rows[0]
    const titleLower = (item.title || '').toLowerCase()
    let detectedType = item.type ? item.type.toLowerCase() : 'news'

    if (titleLower.startsWith('show hn')) detectedType = 'show'
    else if (titleLower.startsWith('ask hn')) detectedType = 'ask'

    // Formattazione finale del payload come si aspetta la pagina Vue
    return {
      success: true,
      data: {
        ...item,
        type: detectedType,
        points: item.points || item.score || 1,
        author: typeof item.author === 'object' ? item.author?.username || 'community' : (item.author || 'community'),
        summary_it: item.text || `Analisi Trinity AI: Notizia proveniente da Hacker News. Impatto architetturale rilevante per gli ingegneri dell'ecosistema DKP.`,
        tags: [
          detectedType === 'show' ? 'ShowHN' : detectedType === 'ask' ? 'AskHN' : 'Tech',
          'HackerNews',
          'TrinityAI'
        ]
      }
    }
  } catch (err: any) {
    console.error('❌ [API News Dettaglio Error]:', err)
    if (err.statusCode) throw err
    
    throw createError({
      statusCode: 500,
      statusMessage: `Errore recupero dettaglio notizia: ${err.message}`
    })
  }
})