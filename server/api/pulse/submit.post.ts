// server/api/pulse/submit.post.ts
import { defineEventHandler, readBody, createError, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function normalizePulseType(rawType: any): 'news' | 'ask' | 'show' | 'jobs' {
  const t = String(rawType || 'news').trim().toLowerCase()
  if (t === 'ask' || t.includes('ask')) return 'ask'
  if (t === 'show' || t.includes('show')) return 'show'
  if (t === 'job' || t === 'jobs' || t.includes('job')) return 'jobs'
  return 'news'
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  try {
    const body = await readBody(event)
    const sessionUser = extractDkpUserFromEvent(event)

    const title = String(body?.title || '').trim()
    const rawUrl = String(body?.url || '').trim()
    const content = String(body?.content || body?.text || '').trim()
    const type = normalizePulseType(body?.type)
    const notarizeSha256 = Boolean(body?.notarize)

    if (!title || title.length < 5) {
      throw createError({ statusCode: 400, statusMessage: 'Il titolo deve contenere almeno 5 caratteri.' })
    }

    if ((type === 'ask' || type === 'jobs') && !content && !rawUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: `Inserisci una descrizione o un link per pubblicare nella sezione ${type.toUpperCase()}.`
      })
    }

    if (rawUrl && !/^https?:\/\/.+/i.test(rawUrl)) {
      throw createError({ statusCode: 400, statusMessage: 'URL non valido: deve iniziare con http:// o https://' })
    }

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // Assicura colonne aggiornate su pulse_stories in Pure SQL
    await db.execute(sql`ALTER TABLE pulse_stories ADD COLUMN IF NOT EXISTS content TEXT;`).catch(() => null)
    await db.execute(sql`ALTER TABLE pulse_stories ADD COLUMN IF NOT EXISTS vault_hash VARCHAR(128);`).catch(() => null)
    await db.execute(sql`ALTER TABLE pulse_stories ADD COLUMN IF NOT EXISTS author_id INTEGER;`).catch(() => null)

    const author = String(sessionUser?.username || body?.author || 'community_user').trim().replace(/^@+/, '')
    const authorId = sessionUser?.id ? Number(sessionUser.id) : (body?.authorId ? Number(body.authorId) : null)

    // Estrazione pulita del dominio
    let domain = 'devkernelpulse.org'
    if (rawUrl) {
      try {
        const parsedUrl = new URL(rawUrl)
        domain = parsedUrl.hostname.replace(/^www\./, '')
      } catch {}
    }

    // Calcolo bonus XP per tipologia HN
    const xpMap: Record<'news' | 'ask' | 'show' | 'jobs', number> = {
      news: 15,
      ask: 20,
      show: 30,
      jobs: 25
    }
    const xpBonus = xpMap[type] + (notarizeSha256 ? 15 : 0)

    const safeUrl = rawUrl || `https://devkernelpulse.org/item?title=${encodeURIComponent(title)}`
    const vaultHash = notarizeSha256
      ? createHash('sha256')
          .update(`DKP-PULSE|${type}|${author}|${title}|${safeUrl}|${content}|${Date.now()}`)
          .digest('hex')
      : null

    const insertRes = await db.execute(sql`
      INSERT INTO pulse_stories (
        title, url, domain, type, content, author, author_id, points, comments_count, xp_awarded, vault_hash, created_at
      )
      VALUES (
        ${title},
        ${safeUrl},
        ${domain},
        ${type},
        ${content || null},
        ${author},
        ${authorId},
        1,
        0,
        ${xpBonus},
        ${vaultHash},
        NOW()
      )
      RETURNING id, title, url, domain, type, content, author, author_id AS "authorId", points, comments_count AS "commentsCount", xp_awarded AS "xpAwarded", vault_hash AS "vaultHash", created_at AS "createdAt";
    `)

    const createdStory = extractRows(insertRes)[0] || null

    // Accreditamento XP atomico su users e ledger transazioni
    if (authorId && authorId > 0) {
      await db.execute(sql`
        UPDATE users
        SET xp = COALESCE(xp, 0) + ${xpBonus}
        WHERE id = ${authorId};
      `).catch(() => null)

      const actionDesc = `Pulse HN [${type.toUpperCase()}]: ${title.slice(0, 60)}`
      await db.execute(sql`
        INSERT INTO user_xp_transactions (user_id, action_type, description, amount, created_at)
        VALUES (${authorId}, ${`PULSE_${type.toUpperCase()}`}, ${actionDesc}, ${xpBonus}, NOW());
      `).catch(() => null)

      if (vaultHash && createdStory?.id) {
        await db.execute(sql`
          INSERT INTO vault_certs (user_id, tool_type, title, hash, created_at)
          VALUES (${authorId}, ${`PULSE_${type.toUpperCase()}`}, ${title}, ${vaultHash}, NOW());
        `).catch(() => null)
      }
    }

    return {
      success: true,
      message: `Segnale pubblicato su ${type.toUpperCase()}! Accredito di +${xpBonus} XP completato.`,
      xpGranted: xpBonus,
      vaultHash,
      data: createdStory
    }
  } catch (err: any) {
    console.error('[PULSE SUBMIT ERROR]', err)
    if (err?.statusCode) throw err
    return {
      success: false,
      message: err?.message || 'Errore durante la pubblicazione nel Kernel DKP.'
    }
  }
})