// server/api/pulse/submit.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, url, type, author, authorId } = body

    if (!title || !type) {
      throw createError({ statusCode: 400, statusMessage: 'Titolo e Sezione sono obbligatori' })
    }

    const db = await getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

    // 1. Estrazione pulita del dominio
    let domain = 'devkernelpulse.org'
    if (url && typeof url === 'string' && url.startsWith('http')) {
      try {
        const parsedUrl = new URL(url)
        domain = parsedUrl.hostname.replace(/^www\./, '')
      } catch {
        // Fallback silente se l'URL è malformato
      }
    }

    // 2. Calcolo bonus XP in base alla tipologia
    let xpBonus = 15 // Default per News
    if (type === 'ask') xpBonus = 20
    else if (type === 'show') xpBonus = 30
    else if (type === 'job' || type === 'jobs') xpBonus = 25

    const safeUrl = url || `https://devkernelpulse.org/item?title=${encodeURIComponent(title)}`

    // 3. Inserimento del post nel feed (FIX: rimosso status)
    await db.execute(sql`
      INSERT INTO pulse_stories (title, url, domain, type, author, author_id, points, xp_awarded, created_at)
      VALUES (${title}, ${safeUrl}, ${domain}, ${type}, ${author || 'community_user'}, ${authorId || null}, 1, ${xpBonus}, NOW());
    `)

    // 4. Assegnazione automatica del Bonus XP e storico transazioni
    const targetUserId = authorId ? Number(authorId) : null
    if (targetUserId) {
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + ${xpBonus}` })
        .where(sql`id = ${targetUserId}`)

      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Pulse Submit [${type.toUpperCase()}]: ${title.substring(0, 30)}...`,
        points: xpBonus
      })
    }

    return {
      success: true,
      message: `Contenuto pubblicato con successo su ${type.toUpperCase()}! Hai guadagnato +${xpBonus} XP! 🔥`,
      xpGranted: xpBonus
    }
  } catch (err: any) {
    console.error('[PULSE SUBMIT ERROR]', err)
    return { success: false, message: err?.message || 'Errore durante la pubblicazione' }
  }
})