// server/services/crawler.service.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export function normalizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  try {
    const trimmed = rawUrl.trim()
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return trimmed.toLowerCase()
    }
    const parsed = new URL(trimmed)
    parsed.searchParams.delete('utm_source')
    parsed.searchParams.delete('utm_medium')
    parsed.searchParams.delete('utm_campaign')
    parsed.searchParams.delete('ref')
    
    let clean = parsed.toString()
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1)
    }
    return clean.toLowerCase()
  } catch {
    return (rawUrl || '').trim().toLowerCase()
  }
}

export class CrawlerService {
  static async saveCrawledPost(post: {
    title?: string
    url?: string
    domain?: string
    type?: 'news' | 'ask' | 'show' | 'jobs'
    author?: string
  }) {
    if (!post || !post.title) return false
    
    const db = getDb()
    if (!db) return false

    const rawTitle = post.title.trim()
    const lowerTitle = rawTitle.toLowerCase()

    // Auto-classificazione per titolo
    let finalType = post.type || 'news'
    if (lowerTitle.startsWith('ask hn:') || lowerTitle.startsWith('ask dkp:')) {
      finalType = 'ask'
    } else if (lowerTitle.startsWith('show hn:') || lowerTitle.startsWith('show dkp:')) {
      finalType = 'show'
    }

    // Costruzione sicura URL
    const safeUrl = post.url || `https://news.ycombinator.com/item`
    const cleanUrl = normalizeUrl(safeUrl)
    if (!cleanUrl) return false

    // Controllo esistenza nel DB
    const existing: any = await db.execute(sql`
      SELECT id, type FROM pulse_stories 
      WHERE LOWER(url) = ${cleanUrl} 
         OR LOWER(title) = ${lowerTitle}
      LIMIT 1;
    `)

    const rows = existing?.rows || existing || []
    
    if (rows.length > 0) {
      const existingRecord = rows[0]
      // Se il post esiste già ma ha un tipo diverso, aggiorna la sezione
      if (existingRecord.type !== finalType) {
        await db.execute(sql`
          UPDATE pulse_stories 
          SET type = ${finalType} 
          WHERE id = ${existingRecord.id};
        `)
        return true
      }
      return false
    }

    // Inserimento nuovo post
    await db.execute(sql`
      INSERT INTO pulse_stories (title, url, domain, type, author, points, created_at)
      VALUES (${rawTitle}, ${cleanUrl}, ${post.domain || 'devkernelpulse.org'}, ${finalType}, ${post.author || 'dkp_crawler'}, 1, CURRENT_TIMESTAMP);
    `)

    return true
  }

  static async purgeDuplicates() {
    const db = getDb()
    if (!db) return 0

    const result: any = await db.execute(sql`
      DELETE FROM pulse_stories a
      USING pulse_stories b
      WHERE a.id < b.id 
        AND (LOWER(a.url) = LOWER(b.url) OR LOWER(a.title) = LOWER(b.title));
    `)

    return result?.rowCount || 0
  }
}