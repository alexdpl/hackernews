// server/utils/hnFetcher.ts
import { getDb } from './db'
import { sql } from 'drizzle-orm'

export interface HnStoryRaw {
  id: number
  title: string
  slug: string
  url?: string
  score?: number
  by?: string
  time?: number
  type: 'show' | 'ask' | 'job' | 'story'
  text?: string
}

export interface HnFetchResult {
  totalFetched: number
  alreadyInDb: number
  newStories: HnStoryRaw[]
}

/**
 * Helper per generare uno slug univoco e SEO-friendly dal titolo e ID
 */
export function slugifyTitle(title: string, id: number | string): string {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9\s-]/g, '')    // Rimuove caratteri speciali
    .trim()
    .replace(/\s+/g, '-')           // Sostituisce spazi con trattini
    .slice(0, 80)

  return `${cleanTitle}-${id}`
}

/**
 * 1. Recupera gli ID in base al tipo di feed (Focus su 'show', 'ask', 'top' o 'job')
 */
export async function fetchHnStoryIds(
  type: 'show' | 'ask' | 'top' | 'job' = 'show', 
  limit = 30
): Promise<number[]> {
  let endpoint = 'https://hacker-news.firebaseio.com/v0/showstories.json'

  if (type === 'ask') {
    endpoint = 'https://hacker-news.firebaseio.com/v0/askstories.json'
  } else if (type === 'job') {
    endpoint = 'https://hacker-news.firebaseio.com/v0/jobstories.json'
  } else if (type === 'top') {
    endpoint = 'https://hacker-news.firebaseio.com/v0/topstories.json'
  }

  const res = await fetch(endpoint, {
    headers: { 'Accept': 'application/json' }
  })

  if (!res.ok) {
    throw new Error(`[HN Fetcher] Errore HTTP ${res.status} durante il recupero ID (${type})`)
  }

  const ids: number[] = await res.json()
  return (ids || []).slice(0, limit)
}

/**
 * 2. Recupera i dettagli di una singola storia da HN arricchendola con Slug e Typology
 */
export async function fetchHnItem(id: number, forcedType?: 'show' | 'ask' | 'job' | 'story'): Promise<HnStoryRaw | null> {
  try {
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
    if (!res.ok) return null
    const data = await res.json()
    
    if (!data || data.deleted || data.dead || !data.title) {
      return null
    }

    // Determinazione del tipo
    let detectedType: 'show' | 'ask' | 'job' | 'story' = forcedType || 'story'
    if (!forcedType) {
      if (data.type === 'job') detectedType = 'job'
      else if (data.title.toLowerCase().startsWith('show hn')) detectedType = 'show'
      else if (data.title.toLowerCase().startsWith('ask hn')) detectedType = 'ask'
    }

    return {
      id: data.id,
      title: data.title,
      slug: slugifyTitle(data.title, data.id),
      url: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
      score: data.score || 0,
      by: data.by || 'anonymous',
      time: data.time,
      type: detectedType,
      text: data.text
    }
  } catch (err) {
    console.warn(`[HN Fetcher] Fallito il fetch per item ID ${id}:`, err)
    return null
  }
}

/**
 * 3. Deduplicazione contro Neon DB via Pure SQL Mode (`getDb()`)
 */
export async function filterNewHnIds(ids: number[]): Promise<{ newIds: number[]; existingIds: number[] }> {
  if (!ids || ids.length === 0) {
    return { newIds: [], existingIds: [] }
  }

  try {
    const db = getDb()
    
    // Binding sicuro dell'array per Neon DB / Postgres
    const result = await db.execute(sql`
      SELECT hn_id 
      FROM hn_stories 
      WHERE hn_id = ANY(${ids})
    `)

    const rows: any[] = Array.isArray(result) ? result : (result.rows || [])
    const existingSet = new Set(rows.map(row => Number(row.hn_id)))

    const newIds = ids.filter(id => !existingSet.has(id))
    const existingIds = ids.filter(id => existingSet.has(id))

    return { newIds, existingIds }
  } catch (error) {
    console.error('[HN Fetcher] Errore deduplicazione Neon DB:', error)
    return { newIds: ids, existingIds: [] }
  }
}

/**
 * 4. Ingestore Batch Principale (Show HN + Ask HN Focus)
 */
export async function ingestHnFeed(
  type: 'show' | 'ask' | 'top' = 'show', 
  limit = 20
): Promise<HnFetchResult> {
  const rawIds = await fetchHnStoryIds(type, limit)
  const { newIds, existingIds } = await filterNewHnIds(rawIds)

  if (newIds.length === 0) {
    return {
      totalFetched: rawIds.length,
      alreadyInDb: existingIds.length,
      newStories: []
    }
  }

  const itemsPromises = newIds.map(id => fetchHnItem(id, type))
  const fetchedItems = await Promise.all(itemsPromises)
  const validStories = fetchedItems.filter((item): item is HnStoryRaw => item !== null)

  return {
    totalFetched: rawIds.length,
    alreadyInDb: existingIds.length,
    newStories: validStories
  }
}

/**
 * 5. Ingestore specifico per i Job (per isolarli nella sezione Bounties/Jobs)
 */
export async function ingestHnJobs(limit = 15): Promise<HnFetchResult> {
  const rawIds = await fetchHnStoryIds('job', limit)
  const { newIds, existingIds } = await filterNewHnIds(rawIds)

  if (newIds.length === 0) {
    return {
      totalFetched: rawIds.length,
      alreadyInDb: existingIds.length,
      newStories: []
    }
  }

  const itemsPromises = newIds.map(id => fetchHnItem(id, 'job'))
  const fetchedItems = await Promise.all(itemsPromises)
  const validJobs = fetchedItems.filter((item): item is HnStoryRaw => item !== null)

  return {
    totalFetched: rawIds.length,
    alreadyInDb: existingIds.length,
    newStories: validJobs
  }
}