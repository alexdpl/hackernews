import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import * as sessionUtils from '~~/server/utils/session'
import { sentinelAuditCrawlerItem } from '~~/server/utils/dkpCrawlerService'
import { resolveNewsTable } from '~~/server/utils/dkpNewsRepo'

async function resolveCurrentUser(event: any) {
  const s = sessionUtils as Record<string, any>
  const fn = s.getSessionUser || s.getUserSession || s.getDkpSessionUser || s.getAuthUser || s.verifySession
  if (typeof fn === 'function') {
    const res = await fn(event).catch(() => null)
    return res?.user || res || null
  }
  return event.context?.user || null
}

export default defineEventHandler(async (event) => {
  const user = await resolveCurrentUser(event)
  if (!user || !user.id) {
    throw createError({ statusCode: 401, statusMessage: 'Effettua il login per inviare un link e guadagnare +25 XP.' })
  }

  const body = await readBody(event)
  const title = String(body?.title || '').trim()
  const rawUrl = String(body?.url || '').trim()
  const channel = ['feed', 'ask', 'show', 'jobs'].includes(String(body?.channel)) ? String(body.channel) : 'feed'

  if (title.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Inserisci un titolo tecnico di almeno 6 caratteri.' })
  }

  let domain = 'devkernelpulse.org'
  let cleanUrl = rawUrl || '/ask'
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
      cleanUrl = parsed.toString()
      domain = parsed.hostname.replace(/^www\./, '')
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'URL non valido.' })
    }
  }

  const audit = sentinelAuditCrawlerItem({
    externalId: `user-${user.id}-${Date.now()}`,
    title,
    url: cleanUrl,
    domain,
    author: user.username || 'dkp_builder',
    points: 5,
    commentsCount: 0,
    feedChannel: channel as any,
    sourceProvider: 'HN',
    tags: ['community', channel]
  })

  if (!audit.approved) {
    throw createError({ statusCode: 400, statusMessage: `Bloccato da ${audit.sentinelHandle}: ${audit.reason}` })
  }

  const db = await getDb()
  const meta = await resolveNewsTable()
  if (!db || !meta) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  const tbl = meta.tableName
  const cols = meta.columns
  const authorCol = cols.has('author') ? 'author' : (cols.has('by') ? 'by' : null)
  const scoreCol = cols.has('points') ? 'points' : (cols.has('score') ? 'score' : null)

  const insertCols = ['title', 'url', 'feed_channel', 'source_provider', 'sentinel_verified', 'sentinel_hash']
  const insertVals = [
    `'${title.replace(/'/g, "''")}'`,
    `'${cleanUrl.replace(/'/g, "''")}'`,
    `'${channel}'`,
    `'COMMUNITY_LINK'`,
    'TRUE',
    `'${audit.sha256}'`
  ]
  if (cols.has('domain')) { insertCols.push('domain'); insertVals.push(`'${domain}'`) }
  if (authorCol) { insertCols.push(`"${authorCol}"`); insertVals.push(`'${String(user.username || 'dkp_builder').replace(/'/g, "''")}'`) }
  if (scoreCol) { insertCols.push(`"${scoreCol}"`); insertVals.push('5') }
  if (cols.has('type')) { insertCols.push('type'); insertVals.push(`'${channel}'`) }
  if (cols.has('created_at')) { insertCols.push('created_at'); insertVals.push('NOW()') }

  await db.execute(sql.raw(`INSERT INTO "${tbl}" (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')});`))

  await db.execute(sql`
    UPDATE users
    SET xp = COALESCE(xp, 0) + 25,
        karma = COALESCE(karma, 0) + 5
    WHERE id = ${user.id};
  `).catch(() => null)

  return {
    success: true,
    xpAwarded: 25,
    sentinelVerifiedBy: audit.sentinelHandle,
    sha256: audit.sha256,
    message: 'Link pubblicato e verificato da @sentinel_ai! Hai guadagnato +25 XP.'
  }
})