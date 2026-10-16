// server/utils/dkp-crawler/engine.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { sanitizeUrl } from '~~/server/utils/sanitizer'
import { scrapeStaticPage, type ScrapedArticleData } from './cheerio-scraper'
import { scrapeDynamicPage } from './puppeteer-scraper'
import { delayWithJitter } from './stealth'

export interface CrawlerRunOptions {
  section: 'news' | 'ask' | 'show' | 'jobs' | string
  limit?: number
  /** Se true, esegue l'estrazione approfondita del testo (Deep Scraping) per ogni link trovato */
  deepScrape?: boolean
}

export interface CrawlerRunResult {
  success: boolean
  message: string
  addedCount: number
  section: string
}

export interface DeepCrawlOptions {
  forceDynamic?: boolean
  minWordCountThreshold?: number
  enableJitter?: boolean
  minDelayMs?: number
  maxDelayMs?: number
  deviceType?: 'desktop' | 'mobile'
  waitForSelector?: string
}

export interface DeepCrawlResult {
  success: boolean
  engineUsed: 'cheerio' | 'puppeteer'
  executionTimeMs: number
  data?: ScrapedArticleData
  error?: string
}

/**
 * DKP Multi-Engine Crawler Plugin v2.4-GOLD
 * Modulo SaaS Autonomo e Isolabile con supporto Deep Scraping (Cheerio + Puppeteer + Stealth)
 */
export class DKPCrawlerEngine {
  /**
   * Esegue la sincronizzazione automatica per la sezione richiesta
   */
  static async run(options: CrawlerRunOptions): Promise<CrawlerRunResult> {
    const rawInput = (options.section || 'news').toString().toLowerCase()

    // Normalizzazione Sezione
    let section = 'news'
    if (rawInput.includes('ask')) section = 'ask'
    else if (rawInput.includes('show')) section = 'show'
    else if (rawInput.includes('job')) section = 'jobs'

    const limit = Math.min(50, Math.max(1, options.limit || 5))
    const db = getDb()

    if (!db) {
      throw new Error('[DKP CRAWLER PLUGIN]: Connessione al Database Neon non disponibile.')
    }

    let itemsAdded = 0
    console.log(`[DKP CRAWLER PLUGIN v2.4] Executing sub-engine: '${section.toUpperCase()}' (Limit: ${limit})`)

    // ==========================================
    // 1. SUB-ENGINE: NEWS (Dev.to API + HackerNews)
    // ==========================================
    if (section === 'news') {
      // 1. Dev.to API (Molto stabile)
      const devToRes: any = await $fetch(`https://dev.to/api/articles?per_page=${Math.ceil(limit / 2)}`).catch(() => [])
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

      // 2. HackerNews Top Stories (Affidabilissima)
      const topIds: any = await $fetch('https://hacker-news.firebaseio.com/v0/topstories.json').catch(() => [])
      if (Array.isArray(topIds)) {
        const targetIds = topIds.slice(0, Math.ceil(limit / 2))
        for (const id of targetIds) {
          const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
          if (item && item.title) {
            const sanitized = sanitizeUrl(item.url || `https://news.ycombinator.com/item?id=${id}`, item.title)
            await db.execute(sql`
              INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
              VALUES (${String(item.title)}, ${sanitized.url}, ${sanitized.domain}, 'news', ${String(item.by || 'hn_crawler')}, ${item.score || 1}, 15)
              ON CONFLICT DO NOTHING;
            `)
            itemsAdded++
          }
        }
      }
    }

    // ==========================================
    // 2. SUB-ENGINE: ASK (Hacker News Ask)
    // ==========================================
    else if (section === 'ask') {
      const askIds = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/askstories.json').catch(() => [])
      const targetIds = Array.isArray(askIds) ? askIds.slice(0, limit) : []

      for (const id of targetIds) {
        const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
        if (item && item.title) {
          const sanitized = sanitizeUrl(item.url || `https://news.ycombinator.com/item?id=${id}`, item.title)
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
    // 3. SUB-ENGINE: SHOW (GitHub Trending)
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
    // 4. SUB-ENGINE: JOBS (RemoteOK)
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
	
	// ==========================================
    // 5. SUB-ENGINE: GITHUB / GITLAB / LINKEDIN TECH TRENDS
    // ==========================================
    else if (section === 'social' || section === 'news') {
      // Ingestione da GitLab Public Explore RSS/API o feed open source
      try {
        const gitlabRes: any = await $fetch('https://gitlab.com/api/v4/projects?visibility=public&per_page=3').catch(() => [])
        if (Array.isArray(gitlabRes)) {
          for (const proj of gitlabRes) {
            const sanitized = sanitizeUrl(proj.web_url, proj.name)
            await db.execute(sql`
              INSERT INTO pulse_stories (title, url, domain, type, author, points, xp_awarded)
              VALUES (${`GitLab OpenSource: ${proj.name} -${proj.description || 'DevOps & CI/CD'}`}, ${sanitized.url}, 'gitlab.com', 'news', ${proj.namespace?.name || 'gitlab_user'}, 25, 20)
              ON CONFLICT DO NOTHING;
            `)
            itemsAdded++
          }
        }
      } catch (e) {
        console.warn('⚠️ [CRAWLER] GitLab sync non disponibile.')
      }
    }
  
	

    return {
      success: true,
      message: `DKP Crawler Plugin [${section.toUpperCase()}] completato! ${itemsAdded} elementi sincronizzati su Neon DB.`,
      addedCount: itemsAdded,
      section
    }
  }

  /**
   * DEEP SCRAPING ENGINE: Estrazione mirata e intelligente da qualsiasi URL (Cheerio + Puppeteer Fallback)
   */
  static async deepCrawl(targetUrl: string, options: DeepCrawlOptions = {}): Promise<DeepCrawlResult> {
    const startTime = Date.now()
    const minThreshold = options.minWordCountThreshold ?? 80
    const enableJitter = options.enableJitter !== false

    // 1. Jitter stealth per eludere blocchi IP
    if (enableJitter) {
      await delayWithJitter(options.minDelayMs || 1000, options.maxDelayMs || 3000)
    }

    // 2. Esecuzione forzata via Puppeteer se richiesta
    if (options.forceDynamic) {
      try {
        const dynamicData = await scrapeDynamicPage(targetUrl, {
          deviceType: options.deviceType,
          waitForSelector: options.waitForSelector
        })
        return {
          success: true,
          engineUsed: 'puppeteer',
          executionTimeMs: Date.now() - startTime,
          data: dynamicData
        }
      } catch (err) {
        return {
          success: false,
          engineUsed: 'puppeteer',
          executionTimeMs: Date.now() - startTime,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }

    // 3. FAST PATH: Cheerio
    try {
      const staticData = await scrapeStaticPage(targetUrl, { deviceType: options.deviceType })

      const isContentValid =
        staticData.wordCount >= minThreshold &&
        staticData.title !== 'Senza Titolo' &&
        !staticData.contentText.includes('Please enable JavaScript to continue')

      if (isContentValid) {
        return {
          success: true,
          engineUsed: 'cheerio',
          executionTimeMs: Date.now() - startTime,
          data: staticData
        }
      }

      console.warn(`[DKP Engine] Contenuto statico insufficiente (${staticData.wordCount} parole). Fallback su Puppeteer per URL: ${targetUrl}`)
    } catch (staticErr) {
      console.warn(`[DKP Engine] Scraping statico fallito per ${targetUrl}. Motivo:`, staticErr)
    }

    // 4. FALLBACK PATH: Puppeteer
    try {
      const dynamicData = await scrapeDynamicPage(targetUrl, {
        deviceType: options.deviceType,
        waitForSelector: options.waitForSelector
      })
      return {
        success: true,
        engineUsed: 'puppeteer',
        executionTimeMs: Date.now() - startTime,
        data: dynamicData
      }
    } catch (dynamicErr) {
      return {
        success: false,
        engineUsed: 'puppeteer',
        executionTimeMs: Date.now() - startTime,
        error: dynamicErr instanceof Error ? dynamicErr.message : String(dynamicErr)
      }
    }
  }

  /**
   * Pulizia duplicati DB
   */
  static async purge(): Promise<{ success: boolean; message: string }> {
    const db = getDb()
    if (!db) throw new Error('DB non disponibile')

    await db.execute(sql`
      DELETE FROM pulse_stories a USING pulse_stories b
      WHERE a.id < b.id AND a.url = b.url;
    `)

    return {
      success: true,
      message: 'Pulizia duplicati completata con successo.'
    }
  }
}