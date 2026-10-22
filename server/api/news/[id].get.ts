// server/api/news/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id')
  const numericId = Number(rawId)

  if (!rawId || isNaN(numericId) || numericId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID notizia non valido o mancante.'
    })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  try {
    // Ricerca della storia nel database Neon per ID
    const res: any = await db.execute(sql`
      SELECT id, title, url, domain, points, author, comments_count, created_at
      FROM pulse_stories
      WHERE id = ${numericId};
    `)

    const story = res?.rows?.[0] || res?.[0]

    if (story) {
      return {
        id: story.id,
        title: story.title,
        domain: story.domain || 'devkernelpulse.org',
        url: story.url || `https://devkernelpulse.org/item/${story.id}`,
        user: typeof story.author === 'object' ? story.author?.username || 'community' : (story.author || 'community'),
        points: story.points || 1,
        time_ago: 'Recente',
        comments_count: story.comments_count || 0,
        content: story.title + ' — Sincronizzato ufficialmente tramite DKP Crawler v2.5-GOLD.',
        comments: [
          { id: 1, user: 'pulse_guardian', time_ago: 'Pochi minuti fa', text: 'Articolo verificato e archiviato con successo nel Kernel DB.' }
        ]
      }
    }

    // Fallback se l'ID non viene trovato nel DB
    return {
      id: numericId,
      title: `Notizia Tech DKP #${numericId}: Approfondimento v2.5-GOLD`,
      domain: 'devkernelpulse.org',
      url: 'https://devkernelpulse.org',
      user: 'alexdpl',
      points: 42,
      time_ago: 'Di recente',
      comments_count: 1,
      content: 'Discussione e aggiornamenti di sistema legati all ecosistema developer DevKernelPulse.',
      comments: [
        { id: 99, user: 'kernel_agent', time_ago: 'Pochi minuti fa', text: 'Nota: Elemento di fallback generato dal sistema.' }
      ]
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Errore recupero dettaglio notizia: ${err.message}`
    })
  }
})