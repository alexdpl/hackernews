// server/utils/crawlerEngines.ts
import { sql } from 'drizzle-orm'
import { getDb } from './db'
import { sanitizeUrl } from './sanitizer'
import { slugify } from './slugify'

// Helper per il throttling (evita blocchi 419 da parte di Firebase/HN)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const crawlerHeaders = { 
  'User-Agent': 'DevKernelPulse-Bot/2.6 (admin@devkernelpulse.org)',
  'Accept': 'application/json'
}

/**
 * 1. Engine News: Dev.to + Hacker News Top Stories
 */
export async function runEngineNews(limit = 5) {
  const db = await getDb()
  if (!db) return { success: false, engine: 'news', error: 'Database non disponibile' }
  
  let importedCount = 0

  try {
    // A. Dev.to API
    const devToRes: any = await $fetch(`https://dev.to/api/articles?per_page=${limit}`, { headers: crawlerHeaders }).catch(() => [])
    if (Array.isArray(devToRes)) {
      for (const article of devToRes) {
        if (!article || !article.title) continue
        const sanitized = sanitizeUrl(article.url, article.title)
        const generatedSlug = slugify(article.title) || `devto-${article.id || Date.now()}`
        
        await db.execute(sql`
          INSERT INTO pulse_stories (title, slug, url, domain, type, author, points, xp_awarded)
          VALUES (${article.title}, ${generatedSlug}, ${sanitized.url}, ${sanitized.domain}, 'news', ${article.user?.username || 'devto_bot'}, ${article.public_reactions_count || 10}, 15)
          ON CONFLICT (url) DO NOTHING;
        `)
        importedCount++
      }
    }

    // B. Hacker News Top Stories
    const topIds: any = await $fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { headers: crawlerHeaders }).catch(() => [])
    if (Array.isArray(topIds)) {
      for (let i = 0; i < Math.min(limit, topIds.length); i++) {
        const itemId = topIds[i]
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`, { headers: crawlerHeaders }).catch(() => null)
        
        if (item && item.title) {
          const sanitized = sanitizeUrl(item.url, item.title)
          const generatedSlug = slugify(item.title) || `hn-${item.id}`
          
          await db.execute(sql`
            INSERT INTO pulse_stories (title, slug, url, domain, type, author, points, xp_awarded)
            VALUES (${item.title}, ${generatedSlug}, ${sanitized.url}, ${sanitized.domain}, 'news', ${item.by || 'hn_crawler'}, ${item.score || 1}, 15)
            ON CONFLICT (url) DO NOTHING;
          `)
          importedCount++
        }
        
        await sleep(250) // Pausa di cortesia anti-rate-limit
      }
    }

    return { success: true, engine: 'news', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'news', error: err.message }
  }
}

/**
 * 2. Engine Ask: Hacker News Ask Stories
 */
export async function runEngineAsk(limit = 5) {
  const db = await getDb()
  if (!db) return { success: false, engine: 'ask', error: 'Database non disponibile' }

  let importedCount = 0
  try {
    const askIds: any = await $fetch('https://hacker-news.firebaseio.com/v0/askstories.json', { headers: crawlerHeaders }).catch(() => [])
    if (Array.isArray(askIds)) {
      for (let i = 0; i < Math.min(limit, askIds.length); i++) {
        const itemId = askIds[i]
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`, { headers: crawlerHeaders }).catch(() => null)
        
        if (item && item.title) {
          const sanitized = sanitizeUrl(item.url, item.title)
          const generatedSlug = slugify(item.title) || `hn-ask-${item.id}`
          
          await db.execute(sql`
            INSERT INTO pulse_stories (title, slug, url, domain, type, author, points, xp_awarded)
            VALUES (${item.title}, ${generatedSlug}, ${sanitized.url}, 'devkernelpulse.org', 'ask', ${item.by || 'community_ask'}, ${item.score || 1}, 20)
            ON CONFLICT (url) DO NOTHING;
          `)
          importedCount++
        }

        await sleep(250)
      }
    }
    return { success: true, engine: 'ask', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'ask', error: err.message }
  }
}

/**
 * 3. Engine Show: GitHub Trending Repositories
 */
export async function runEngineShow(limit = 5) {
  const db = await getDb()
  if (!db) return { success: false, engine: 'show', error: 'Database non disponibile' }

  let importedCount = 0
  try {
    const ghRes: any = await $fetch(`https://api.github.com/search/repositories?q=stars:>5000&sort=stars&order=desc&per_page=${limit}`, {
      headers: crawlerHeaders
    }).catch(() => null)
    
    if (ghRes && ghRes.items) {
      for (const repo of ghRes.items) {
        if (!repo || !repo.full_name) continue
        const sanitized = sanitizeUrl(repo.html_url, repo.name)
        const fullTitle = `${repo.full_name} - ${repo.description || 'Open Source Project'}`
        const generatedSlug = slugify(repo.full_name) || `gh-${repo.id}`
        
        await db.execute(sql`
          INSERT INTO pulse_stories (title, slug, url, domain, type, author, points, xp_awarded)
          VALUES (${fullTitle}, ${generatedSlug}, ${sanitized.url}, 'github.com', 'show', ${repo.owner?.login || 'github_user'}, ${repo.stargazers_count || 50}, 30)
          ON CONFLICT (url) DO NOTHING;
        `)
        importedCount++
      }
    }
    return { success: true, engine: 'show', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'show', error: err.message }
  }
}

/**
 * 4. Engine Jobs: RemoteOK API
 */
export async function runEngineJobs(limit = 5) {
  const db = await getDb()
  if (!db) return { success: false, engine: 'jobs', error: 'Database non disponibile' }

  let importedCount = 0
  try {
    const jobsRes: any = await $fetch('https://remoteok.com/api', { headers: crawlerHeaders }).catch(() => [])
    if (Array.isArray(jobsRes) && jobsRes.length > 1) {
      const jobs = jobsRes.slice(1, limit + 1)
      for (const job of jobs) {
        if (!job || !job.position || !job.company) continue
        const title = `${job.position} @ ${job.company} (${job.location || 'Remote'})`
        const sanitized = sanitizeUrl(job.url || job.apply_url, title)
        const generatedSlug = slugify(`${job.position}-${job.company}`) || `job-${job.id || Date.now()}`

        await db.execute(sql`
          INSERT INTO pulse_stories (title, slug, url, domain, type, author, points, xp_awarded)
          VALUES (${title}, ${generatedSlug}, ${sanitized.url}, 'remoteok.com', 'jobs', ${job.company || 'RemoteOK'}, 10, 25)
          ON CONFLICT (url) DO NOTHING;
        `)
        importedCount++
      }
    }
    return { success: true, engine: 'jobs', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'jobs', error: err.message }
  }
}