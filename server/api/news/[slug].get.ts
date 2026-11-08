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
    
    // 🔍 Estrazione intelligente dell'ID numerico dalla fine dello slug (es. "kodivo-821" -> "821")
    const parts = cleanParam.split('-')
    const possibleId = parts[parts.length - 1] || cleanParam

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    let rows: any[] = []

    // Interroghiamo hn_stories cercando per slug esatto, id o hn_id estratto
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
           OR id::text = ${cleanParam} 
           OR id::text = ${possibleId}
           OR hn_id::text = ${possibleId}
           OR hn_id::text = ${cleanParam}
        LIMIT 1
      `)
      rows = resHn.rows || resHn || []
    } catch (e) {
      // Ignora e passa al fallback
    }

    // Fallback su pulse_stories se necessario
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
             OR id::text = ${cleanParam} 
             OR id::text = ${possibleId}
          LIMIT 1
        `)
        rows = resPulse.rows || resPulse || []
      } catch (e) {
        // Ignora
      }
    }

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

    const computedScore = Math.min(98, Math.max(45, (item.points || 10) * 2 + 40))

    return {
      success: true,
      data: {
        ...item,
        type: detectedType,
        tech_score: computedScore,
        summary_it: item.text || `Analisi Trinity AI: Notizia proveniente da Hacker News. Impatto architetturale rilevante per gli ingegneri dell'ecosistema DKP.`,
        tags: [
          detectedType === 'show' ? 'ShowHN' : detectedType === 'ask' ? 'AskHN' : 'Tech',
          'HackerNews'
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