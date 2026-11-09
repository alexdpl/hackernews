// server/api/news/stream.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 4, 20)

    const db = await getDb()
    if (!db) {
      return { success: true, data: [] }
    }

    let items: any[] = []

    // 1. Prova prima pulse_stories (più stabile)
    try {
      const resPulse = await db.execute(sql`
        SELECT * FROM pulse_stories
        ORDER BY id DESC
        LIMIT ${limit}
      `)
      items = resPulse.rows || resPulse || []
    } catch (e) {
      // Ignora
    }

    // 2. Prova hn_stories se pulse_stories è vuota
    if (!items || items.length === 0) {
      try {
        const resHn = await db.execute(sql`
          SELECT * FROM hn_stories
          ORDER BY id DESC
          LIMIT ${limit}
        `)
        items = resHn.rows || resHn || []
      } catch (e) {
        // Ignora
      }
    }

    const formattedData = items.map((item: any) => {
      const titleStr = item.title || 'Notizia Hacker News'
      const titleLower = titleStr.toLowerCase()
      let detectedType = item.type ? String(item.type).toLowerCase() : 'news'
      if (titleLower.startsWith('show hn')) detectedType = 'show'
      else if (titleLower.startsWith('ask hn')) detectedType = 'ask'

      const itemId = item.id || item.hn_id || Math.floor(Math.random() * 10000)
      const rawSlug = item.slug || `${titleLower.replace(/[^a-z0-9]+/g, '-')}-${itemId}`

      return {
        id: itemId,
        title: titleStr,
        slug: rawSlug,
        summary_it: item.text || item.summary || item.summary_it || `Analisi Trinity AI: Notizia tech sincronizzata dall'ecosistema Hacker News.`,
        score: item.points || item.score || 42,
        type: detectedType,
        url: item.url
      }
    })

    return {
      success: true,
      data: formattedData
    }
  } catch (err: any) {
    console.error('❌ [API Stream Error]:', err)
    return {
      success: true,
      data: []
    }
  }
})