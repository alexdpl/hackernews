// server/utils/crawlerEngines.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sanitizeUrl } from '~~/server/utils/sanitizer'

/**
 * ENGINE 1: News Feed (HackerNews Top Stories + Dev.to API)
 */
export async function runEngineNews() {
  const db = getDb()
  let importedCount = 0

  try {
    // 1. Fetch da Dev.to API
    const devToRes: any = await $fetch('https://dev.to/api/articles?per_page=5').catch(() => [])
    if (Array.isArray(devToRes)) {
      for (const article of devToRes) {
        const sanitized = sanitizeUrl(article.url, article.title)
        await db.execute(sql`
          INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
          VALUES (${article.title}, ${sanitized.url}, ${sanitized.domain}, 'news', ${article.user?.username || 'devto_bot'}, ${article.public_reactions_count || 10}, 15)
          ON CONFLICT DO NOTHING;
        `)
        importedCount++
      }
    }

    // 2. Fetch Top Stories da HackerNews
    const topIds: any = await $fetch('https://hacker-news.firebaseio.com/v0/topstories.json').catch(() => [])
    if (Array.isArray(topIds)) {
      for (let i = 0; i < 5; i++) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${topIds[i]}.json`).catch(() => null)
        if (item && item.title) {
          const sanitized = sanitizeUrl(item.url, item.title)
          await db.execute(sql`
            INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
            VALUES (${item.title}, ${sanitized.url}, ${sanitized.domain}, 'news', ${item.by || 'hn_crawler'}, ${item.score || 1}, 15)
            ON CONFLICT DO NOTHING;
          `)
          importedCount++
        }
      }
    }
    return { success: true, engine: 'news', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'news', error: err.message }
  }
}

/**
 * ENGINE 2: Ask DKP (HackerNews Ask Stories)
 */
export async function runEngineAsk() {
  const db = getDb()
  let importedCount = 0

  try {
    const askIds: any = await $fetch('https://hacker-news.firebaseio.com/v0/askstories.json').catch(() => [])
    if (Array.isArray(askIds)) {
      for (let i = 0; i < 5; i++) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${askIds[i]}.json`).catch(() => null)
        if (item && item.title) {
          const sanitized = sanitizeUrl(item.url, item.title)
          await db.execute(sql`
            INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
            VALUES (${item.title}, ${sanitized.url}, 'devkernelpulse.org', 'ask', ${item.by || 'community_ask'}, ${item.score || 1}, 20)
            ON CONFLICT DO NOTHING;
          `)
          importedCount++
        }
      }
    }
    return { success: true, engine: 'ask', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'ask', error: err.message }
  }
}

/**
 * ENGINE 3: Show DKP (HN Show + GitHub Trending Repos)
 */
export async function runEngineShow() {
  const db = getDb()
  let importedCount = 0

  try {
    const ghRes: any = await $fetch('https://api.github.com/search/repositories?q=stars:>5000&sort=stars&order=desc&per_page=5', {
      headers: { 'User-Agent': 'DevKernelPulse-Bot' }
    }).catch(() => null)
    
    if (ghRes && ghRes.items) {
      for (const repo of ghRes.items) {
        const sanitized = sanitizeUrl(repo.html_url, repo.name)
        await db.execute(sql`
          INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
          VALUES (${repo.full_name + ' - ' + (repo.description || 'Open Source Project')}, ${sanitized.url}, 'github.com', 'show', ${repo.owner?.login || 'github_user'}, ${repo.stargazers_count || 50}, 30)
          ON CONFLICT DO NOTHING;
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
 * ENGINE 4: Jobs Hub (RemoteOK API)
 */
export async function runEngineJobs() {
  const db = getDb()
  let importedCount = 0

  try {
    const jobsRes: any = await $fetch('https://remoteok.com/api').catch(() => [])
    if (Array.isArray(jobsRes) && jobsRes.length > 1) {
      const jobs = jobsRes.slice(1, 6)
      for (const job of jobs) {
        if (!job.position || !job.company) continue
        const title = `${job.position} @ ${job.company} (${job.location || 'Remote'})`
        const sanitized = sanitizeUrl(job.url || job.apply_url, title)

        await db.execute(sql`
          INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
          VALUES (${title}, ${sanitized.url}, 'remoteok.com', 'jobs', ${job.company || 'RemoteOK'}, 10, 25)
          ON CONFLICT DO NOTHING;
        `)
        importedCount++
      }
    }
    return { success: true, engine: 'jobs', imported: importedCount }
  } catch (err: any) {
    return { success: false, engine: 'jobs', error: err.message }
  }
}