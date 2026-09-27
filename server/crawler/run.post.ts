// server/api/admin/crawler/run.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const category = body?.category || 'news'
  const limit = Math.min(10, Math.max(1, Number(body?.limit) || 5))

  const db = getDb()
  let insertedCount = 0

  try {
    // -------------------------------------------------------------
    // A. INGESTIONE DEDICATA PER JOB BOARD
    // -------------------------------------------------------------
    if (category === 'job') {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS jobs (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          salary VARCHAR(100),
          tags TEXT[],
          created_at TIMESTAMP DEFAULT NOW()
        )
      `)

      // Provider RemoteOK API
      const jobRes: any = await $fetch('https://remoteok.com/api', { headers: { 'User-Agent': 'DKPCrawler/2.3' } }).catch(() => [])
      const rawJobs = Array.isArray(jobRes) ? jobRes.slice(1, limit + 5) : []

      for (const item of rawJobs) {
        if (!item.position || !item.company || insertedCount >= limit) continue

        // Anti-Duplicazione per Azienda e Posizione
        const existing: any = await db.execute(sql`
          SELECT id FROM jobs WHERE LOWER(title) = LOWER(${item.position}) AND LOWER(company) = LOWER(${item.company}) LIMIT 1
        `)
        if (existing?.rows?.length > 0 || (Array.isArray(existing) && existing.length > 0)) continue

        await db.execute(sql`
          INSERT INTO jobs (title, company, location, salary, tags, created_at)
          VALUES (${item.position}, ${item.company}, ${item.location || 'Remoto'}, ${item.salary || 'Competitive'}, ${item.tags || ['Tech']}, NOW())
        `)
        insertedCount++
      }

      return {
        success: true,
        count: insertedCount,
        message: `Ingestione completata! Aggiunti ${insertedCount} nuovi job unici.`
      }
    }

    // -------------------------------------------------------------
    // B. INGESTIONE POSTS (News, Ask, Show)
    // -------------------------------------------------------------
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        url TEXT,
        type VARCHAR(20) DEFAULT 'news',
        author VARCHAR(100) DEFAULT 'alexdpl',
        points INT DEFAULT 1,
        comments_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    let fetchedItems: Array<{ title: string; url: string; author: string; points: number }> = []

    // 1. Fetch da HackerNews Firebase API
    if (category === 'ask') {
      const askIds: number[] = await $fetch('https://hacker-news.firebaseio.com/v0/askstories.json')
      for (const id of askIds.slice(0, limit * 2)) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (item && item.title) {
          fetchedItems.push({
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${id}`,
            author: item.by || 'alexdpl',
            points: item.score || 10
          })
        }
      }
    } else if (category === 'show') {
      const showIds: number[] = await $fetch('https://hacker-news.firebaseio.com/v0/showstories.json')
      for (const id of showIds.slice(0, limit * 2)) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (item && item.title) {
          fetchedItems.push({
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${id}`,
            author: item.by || 'alexdpl',
            points: item.score || 15
          })
        }
      }
    } else {
      // Feed News Generale: HackerNews Top + Dev.to API
      const topIds: number[] = await $fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      for (const id of topIds.slice(0, limit)) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (item && item.title) {
          fetchedItems.push({
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${id}`,
            author: item.by || 'alexdpl',
            points: item.score || 20
          })
        }
      }
    }

    // 2. Ciclo di Salvataggio con Filtro Anti-Duplicazione
    for (const story of fetchedItems) {
      if (insertedCount >= limit) break

      // Verifica presenza per titolo o URL
      const checkTitle = story.title.trim()
      const dupCheck: any = await db.execute(sql`
        SELECT id FROM posts WHERE LOWER(title) = LOWER(${checkTitle}) LIMIT 1
      `)
      
      const isDuplicate = dupCheck?.rows?.length > 0 || (Array.isArray(dupCheck) && dupCheck.length > 0)
      if (isDuplicate) continue

      await db.execute(sql`
        INSERT INTO posts (title, url, type, author, points, comments_count, created_at)
        VALUES (${checkTitle}, ${story.url}, ${category}, ${story.author}, ${story.points}, 0, NOW())
      `)
      insertedCount++
    }

    return {
      success: true,
      count: insertedCount,
      message: `Ingestione ${category.toUpperCase()} completata! Aggiunti ${insertedCount} articoli unici.`
    }

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Errore durante l esecuzione del DKP Crawler.'
    })
  }
})