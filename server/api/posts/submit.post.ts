// server/api/posts/submit.post.ts
import { defineEventHandler, readBody, getCookie } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, url, text, type } = body // text viene mappato su 'content'
  const username = getCookie(event, 'dkp_user') || body.author || 'alexdpl'

  if (!title || title.trim().length < 3) {
    return { success: false, error: 'Il titolo deve contenere almeno 3 caratteri.' }
  }

  // 🛡️ FILTRO ANTI-SPAM JOBS
  if (type === 'job' || type === 'jobs') {
    if (!url || !url.startsWith('https://')) {
      return { success: false, error: 'I post di tipo Job richiedono un URL aziendale ufficiale in HTTPS.' }
    }
    const spamDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly']
    const isSpamDomain = spamDomains.some(domain => url.includes(domain))
    if (isSpamDomain) {
      return { success: false, error: 'Anti-Spam DKP: Non sono ammessi link accorciati.' }
    }
    if (!text || text.trim().length < 50) {
      return { success: false, error: 'Anti-Spam DKP: L offerta di lavoro deve includere una descrizione dettagliata.' }
    }
  }

  const db = await getDb()

  try {
    // 1. Trova l'utente reale per ottenere il suo ID (Richiesto dalle relazioni Drizzle)
    const userList = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (userList.length === 0) {
      return { success: false, error: 'Utente non trovato nel database.' }
    }
    const user = userList[0]

    // 2. Inserimento del Post pulito con Drizzle
    const newPost = await db.insert(posts).values({
      title: title.trim(),
      url: url || null,
      content: text || null, // Nello schema si chiama content
      type: type || 'news',
      userId: user.id,       // Nello schema si chiama userId
      points: 1,
      commentsCount: 0
    }).returning()

    // 3. GAMIFICATION: Aggiungi 15 XP per il contributo alla community
    const xpReward = 15
    await db.update(users)
      .set({ xp: sql`${users.xp} + ${xpReward}` })
      .where(eq(users.id, user.id))

    await db.insert(xpTransactions).values({
      userId: user.id,
      action: `CREATE_HN_POST_${(type || 'news').toUpperCase()}`,
      points: xpReward
    })

    return { 
      success: true, 
      message: `Contenuto pubblicato con successo! Hai guadagnato +${xpReward} XP.`,
      post: newPost[0],
      xpAwarded: xpReward
    }
  } catch (err: any) {
    console.error('Errore pubblicazione HN:', err)
    return { success: false, error: err.message }
  }
})