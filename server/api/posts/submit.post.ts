// server/api/posts/submit.post.ts (o il file equivalente che riceve la POST di invio)
import { defineEventHandler, readBody, getCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, url, text, type } = body // type o category: 'story', 'ask', 'show', 'job'
  const author = getCookie(event, 'dkp_user') || body.author || 'alexdpl'

  if (!title || title.trim().length < 3) {
    return { success: false, error: 'Il titolo deve contenere almeno 3 caratteri.' }
  }

  // 🛡️ FILTRO ANTI-SPAM RIGOROSO PER I JOBS
  if (type === 'job' || type === 'jobs') {
    if (!url || !url.startsWith('https://')) {
      return { success: false, error: 'I post di tipo Job richiedono un URL aziendale ufficiale in HTTPS.' }
    }

    // Controllo domini di URL shortener indesiderati
    const spamDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly']
    const isSpamDomain = spamDomains.some(domain => url.includes(domain))
    if (isSpamDomain) {
      return { success: false, error: 'Anti-Spam DKP: Non sono ammessi link accorciati per le offerte di lavoro.' }
    }

    if (!text || text.trim().length < 50) {
      return { success: false, error: 'Anti-Spam DKP: L offerta di lavoro deve includere una descrizione dettagliata (minimo 50 caratteri) con tech stack e requisiti.' }
    }
  }

  const db = getDb()

  try {
    // Inserimento nel database Neon
    await db.execute(sql`
      INSERT INTO posts (title, url, text, type, author, points, comments_count)
      VALUES (${title.trim()}, ${url || null}, ${text || null}, ${type || 'story'}, ${author}, 1, 0)
    `)

    return { success: true, message: 'Contenuto pubblicato con successo!' }
  } catch (err: any) {
    console.error('Errore pubblicazione:', err)
    return { success: false, error: err.message }
  }
})