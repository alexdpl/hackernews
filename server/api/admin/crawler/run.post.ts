// server/api/admin/crawler/run.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sanitizeUrl } from '~~/server/utils/sanitizer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    
    const rawInput = (body?.section || body?.type || 'news').toString().toLowerCase()
    
    // Normalizzazione ferrea della sezione
    let section = 'news'
    if (rawInput.includes('ask')) section = 'ask'
    else if (rawInput.includes('show')) section = 'show'
    else if (rawInput.includes('job')) section = 'jobs'
    else if (rawInput.includes('news')) section = 'news'

    const limit = Math.min(30, Math.max(1, parseInt(body?.limit) || 5))
    const db = getDb()
    
    if (!db) {
      throw new Error('Connessione al database Neon non disponibile')
    }

    let itemsAdded = 0
    console.log(`[DKP CRAWLER] Avvio sincronizzazione per sezione normalizzata: '${section.toUpperCase()}' (Limit: ${limit})`)

    // ==========================================
    // SEZIONE 1: NEWS FEED
    // ==========================================
    if (section === 'news') {
      const devToRes: any = await $fetch(`https://dev.to/api/articles?per_page=${limit}`).catch(() => [])
      if (Array.isArray(devToRes)) {
        for (const article of devToRes) {
          const sanitized = sanitizeUrl(article.url, article.title)
          await db.execute(sql`
            INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
            VALUES (${article.title || 'Senza titolo'}, ${sanitized.url}, ${sanitized.domain}, 'news', ${article.user?.username || 'devto_bot'}, ${article.public_reactions_count || 10}, 15)
            ON CONFLICT DO NOTHING;
          `)
          itemsAdded++
        }
      }
    }

    // ==========================================
    // SEZIONE 2: ASK DKP
    // ==========================================
    else if (section === 'ask') {
      const askIds = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/askstories.json').catch(() => [])
      const targetIds = Array.isArray(askIds) ? askIds.slice(0, limit) : []

      for (const id of targetIds) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
        if (item && item.title) {
          const sanitized = sanitizeUrl(item.url, item.title)
          await db.execute(sql`
            INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
            VALUES (${String(item.title)}, ${sanitized.url}, ${sanitized.domain}, 'ask', ${String(item.by || 'community_ask')}, ${item.score || 1}, 20)
            ON CONFLICT DO NOTHING;
          `)
          itemsAdded++
        }
      }
    }

    // ==========================================
    // SEZIONE 3: SHOW DKP
    // ==========================================
    else if (section === 'show') {
      const ghRes: any = await $fetch(`https://api.github.com/search/repositories?q=stars:>5000&sort=stars&order=desc&per_page=${limit}`, {
        headers: { 'User-Agent': 'DevKernelPulse-Bot' }
      }).catch(() => null)

      if (ghRes && ghRes.items) {
        for (const repo of ghRes.items) {
          const title = `${repo.full_name} - ${repo.description || 'Open Source Project'}`
          const sanitized = sanitizeUrl(repo.html_url, repo.name)
          await db.execute(sql`
            INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
            VALUES (${title}, ${sanitized.url}, 'github.com', 'show', ${repo.owner?.login || 'github_user'}, ${repo.stargazers_count || 50}, 30)
            ON CONFLICT DO NOTHING;
          `)
          itemsAdded++
        }
      }
    }

    // ==========================================
    // SEZIONE 4: JOBS HUB
    // ==========================================
    else if (section === 'jobs') {
      const jobsRes: any = await $fetch('https://remoteok.com/api').catch(() => [])
      if (Array.isArray(jobsRes) && jobsRes.length > 1) {
        const jobs = jobsRes.slice(1, limit + 1)
        for (const job of jobs) {
          if (!job.position || !job.company) continue
          const title = `${job.position} @ ${job.company} (${job.location || 'Remote'})`
          const sanitized = sanitizeUrl(job.url || job.apply_url, title)

          await db.execute(sql`
            INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
            VALUES (${title}, ${sanitized.url}, 'remoteok.com', 'jobs', ${job.company || 'RemoteOK'}, 10, 25)
            ON CONFLICT DO NOTHING;
          `)
          itemsAdded++
        }
      }
    }

    return {
      success: true,
      message: `Crawler Engine [${section.toUpperCase()}] completato! Acquisiti ${itemsAdded} elementi nella categoria corretta.`,
      addedCount: itemsAdded,
      section
    }
  } catch (err: any) {
    console.error('[CRAWLER CRITICAL ERROR]:', err)
    throw createError({ 
      statusCode: 500, 
      statusMessage: err?.message || 'Errore critico durante l\'esecuzione del Crawler Engine' 
    })
  }
})