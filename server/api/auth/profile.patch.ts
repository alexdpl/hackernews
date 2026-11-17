// server/api/user/profile.patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  extractDkpUserFromEvent,
  syncCrossSubdomainSessionCookie
} from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function validateSocialHttpsUrl(raw: unknown, fieldLabel: string): string | null {
  if (raw === null || raw === '') return ''
  if (typeof raw !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `URL ${fieldLabel} non valido.` })
  }

  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.length > 255) {
    throw createError({ statusCode: 400, statusMessage: `URL ${fieldLabel} troppo lungo (max 255 caratteri).` })
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') {
      throw createError({
        statusCode: 400,
        statusMessage: `Il link ${fieldLabel} deve iniziare con https://.`
      })
    }
    return parsed.toString()
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 400, statusMessage: `URL ${fieldLabel} non valido.` })
  }
}

function validateAvatarInput(raw: unknown): string | null {
  if (raw === null || raw === '') return ''
  if (typeof raw !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Avatar non valido.' })
  }

  const trimmed = raw.trim()
  if (!trimmed) return ''

  // Consente data URL base64 esclusivamente nei formati raster sicuri (no SVG/HTML)
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length > 3_000_000) {
      throw createError({ statusCode: 413, statusMessage: 'Avatar base64 troppo grande (max 2 MB).' })
    }
    return trimmed
  }

  // Oppure URL HTTPS esterno valido
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' && trimmed.length <= 500) {
      return parsed.toString()
    }
  } catch {}

  throw createError({
    statusCode: 400,
    statusMessage: 'Avatar non valido: usa un URL https:// o un\'immagine PNG/JPEG/WEBP/GIF.'
  })
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per modificare il tuo profilo.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit VARCHAR(255);`).catch(() => null)

    const userId = Number(sessionUser.id)

    let nextBio: string | null = null
    if (body.bio !== undefined) {
      const cleanedBio = String(body.bio || '').trim()
      if (cleanedBio.length > 500) {
        throw createError({
          statusCode: 400,
          statusMessage: 'La bio non può superare i 500 caratteri.'
        })
      }
      nextBio = cleanedBio
    }

    const nextGithub = body.github !== undefined ? validateSocialHttpsUrl(body.github, 'GitHub') : null
    const nextTwitter = body.twitter !== undefined ? validateSocialHttpsUrl(body.twitter, 'X / Twitter') : null
    const nextLinkedin = body.linkedin !== undefined ? validateSocialHttpsUrl(body.linkedin, 'LinkedIn') : null
    const nextReddit = body.reddit !== undefined ? validateSocialHttpsUrl(body.reddit, 'Reddit') : null

    const rawAvatar = body.avatarUrl !== undefined ? body.avatarUrl : body.avatar
    const nextAvatar = rawAvatar !== undefined ? validateAvatarInput(rawAvatar) : null

    const updatedRes = await db.execute(sql`
      UPDATE users
      SET
        bio = CASE WHEN ${nextBio !== null} THEN ${nextBio} ELSE bio END,
        github = CASE WHEN ${nextGithub !== null} THEN ${nextGithub || null} ELSE github END,
        twitter = CASE WHEN ${nextTwitter !== null} THEN ${nextTwitter || null} ELSE twitter END,
        linkedin = CASE WHEN ${nextLinkedin !== null} THEN ${nextLinkedin || null} ELSE linkedin END,
        reddit = CASE WHEN ${nextReddit !== null} THEN ${nextReddit || null} ELSE reddit END,
        avatar_url = CASE WHEN ${nextAvatar !== null} THEN ${nextAvatar || null} ELSE avatar_url END
      WHERE id = ${userId}
      RETURNING
        id,
        username,
        email,
        role,
        COALESCE(xp, 0)::int AS xp,
        avatar_url AS avatar,
        COALESCE(bio, '') AS bio,
        github,
        twitter,
        linkedin,
        reddit,
        created_at AS "createdAt";
    `)

    const updatedUser = extractRows(updatedRes)[0]
    if (!updatedUser) {
      throw createError({ statusCode: 404, statusMessage: 'Utente non trovato.' })
    }

    if (nextAvatar !== null) {
      syncCrossSubdomainSessionCookie(event, {
        ...sessionUser,
        username: updatedUser.username,
        role: String(updatedUser.role || 'user').toLowerCase(),
        avatarUrl: updatedUser.avatar || null
      })
    }

    return {
      success: true,
      message: 'Profilo aggiornato con successo!',
      user: updatedUser
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [UPDATE PROFILE ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante l\'aggiornamento del profilo.'
    })
  }
})