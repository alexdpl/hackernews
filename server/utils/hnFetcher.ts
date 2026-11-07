// server/utils/hnFetcher.ts
import { getDb } from './db'
import { inArray } from 'drizzle-orm'
import { hnStories } from '~/server/db/schema' // Assicurati che lo schema sia importato correttamente, oppure usa la tabella correlata

export interface HnStoryRaw {
  id: number
  title: string
  url?: string
  score?: number
  by?: string
  time?: number
  type?: string
  text?: string
}

export interface HnFetchResult {
  totalFetched: number
  alreadyInDb: number
  newStories: HnStoryRaw[]
}

/**
 * 1. Recupera gli ID delle storie in evidenza (Top o Show HN)
 */
export async function fetchHnStoryIds(type: 'top' | 'show' = 'top', limit = 30): Promise<number[]> {
  const endpoint = type === 'show'
    ? 'https://hacker-news.firebaseio.com/v0/showstories.json'
    : 'https://hacker-news.firebaseio.com/v0/topstories.json'

  const res = await fetch(endpoint, {
    headers: { 'Accept': 'application/json' }
  })

  if (!res.ok) {
    throw new Error(`[HN Fetcher] Errore HTTP ${res.status} durante il recupero degli ID`)
  }

  const ids: number[] = await res.json()
  return (ids || []).slice(0, limit)
}

/**
 * 2. Recupera i dettagli di una singola storia da HN
 */
export async function fetchHnItem(id: number): Promise<HnStoryRaw | null> {
  try {
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
    if (!res.ok) return null
    const data = await res.json()
    
    if (!data || data.deleted || data.dead || !data.title) {
      return null
    }

    return {
      id: data.id,
      title: data.title,
      url: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
      score: data.score || 0,
      by: data.by || 'anonymous',
      time: data.time,
      type: data.type,
      text: data.text
    }
  } catch (err) {
    console.warn(`[HN Fetcher] Fallito il fetch per l'item ID ${id}:`, err)
    return null
  }
}

/**
 * 3. Deduplicazione contro Neon DB via `inArray` nativo di Drizzle (Risolve il bug del record casting)
 */
export async function filterNewHnIds(ids: number[]): Promise<{ newIds: number[]; existingIds: number[] }> {
  if (!ids || ids.length === 0) {
    return { newIds: [], existingIds: [] }
  }

  try {
    const db = getDb()
    
    // Utilizziamo la query nativa con inArray per evitare errori di tipo con Neon DB
    const rows = await db
      .select({ hnId: hnStories.hn_id })
      .from(hnStories)
      .where(inArray(hnStories.hn_id, ids))

    const existingSet = new Set(rows.map(row => Number(row.hnId)))

    const newIds = ids.filter(id => !existingSet.has(id))
    const existingIds = ids.filter(id => existingSet.has(id))

    return { newIds, existingIds }
  } catch (error) {
    console.error('[HN Fetcher] Errore durante la query di deduplicazione:', error)
    return { newIds: ids, existingIds: [] }
  }
}

/**
 * 4. Ingestore batch
 */
export async function ingestHnFeed(type: 'top' | 'show' = 'top', limit = 20): Promise<HnFetchResult> {
  const rawIds = await fetchHnStoryIds(type, limit)
  const { newIds, existingIds } = await filterNewHnIds(rawIds)

  if (newIds.length === 0) {
    return {
      totalFetched: rawIds.length,
      alreadyInDb: existingIds.length,
      newStories: []
    }
  }

  const itemsPromises = newIds.map(id => fetchHnItem(id))
  const fetchedItems = await Promise.all(itemsPromises)
  const validStories = fetchedItems.filter((item): item is HnStoryRaw => item !== null)

  return {
    totalFetched: rawIds.length,
    alreadyInDb: existingIds.length,
    newStories: validStories
  }
}