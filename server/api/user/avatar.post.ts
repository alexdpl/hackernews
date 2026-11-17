// server/api/user/avatar.post.ts
import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  extractDkpUserFromEvent,
  syncCrossSubdomainSessionCookie
} from '~~/server/utils/session'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_IMAGE_SIGNATURES: Array<{
  mime: string
  check: (buf: Buffer) => boolean
}> = [
  {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    mime: 'image/png',
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47
  },
  {
    // JPEG: FF D8 FF
    mime: 'image/jpeg',
    check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  },
  {
    // GIF: GIF87a / GIF89a
    mime: 'image/gif',
    check: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38
  },
  {
    // WEBP: RIFF....WEBP
    mime: 'image/webp',
    check: (b) =>
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP'
  }
]

function detectValidatedImageMime(buffer: Buffer): string | null {
  for (const sig of ALLOWED_IMAGE_SIGNATURES) {
    if (sig.check(buffer)) return sig.mime
  }
  return null
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per aggiornare il tuo avatar.'
    })
  }

  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Nessun file inviato.' })
    }

    const file = formData.find((item) => item.name === 'avatar' || item.name === 'file')
    if (!file || !file.data || file.data.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'File non valido.' })
    }

    if (file.data.length > MAX_AVATAR_BYTES) {
      throw createError({
        statusCode: 413,
        statusMessage: 'Immagine troppo grande (dimensione massima: 2 MB).'
      })
    }

    // Verifica magic bytes reali (blocca SVG/HTML camuffati da immagine)
    const detectedMime = detectValidatedImageMime(file.data)
    if (!detectedMime) {
      throw createError({
        statusCode: 415,
        statusMessage: 'Formato immagine non supportato. Usa PNG, JPEG, WEBP o GIF.'
      })
    }

    const base64Data = file.data.toString('base64')
    const dataUrl = `data:${detectedMime};base64,${base64Data}`

    // Persiste il nuovo avatar su Neon DB per l'utente autenticato
    const db = await getDb()
    if (db) {
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
      `).catch(() => null)

      await db.execute(sql`
        UPDATE users
        SET avatar_url = ${dataUrl}
        WHERE id = ${Number(sessionUser.id)};
      `).catch(() => {})

      syncCrossSubdomainSessionCookie(event, {
        ...sessionUser,
        avatarUrl: dataUrl
      })
    }

    return {
      success: true,
      url: dataUrl
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [AVATAR UPLOAD ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante l\'upload dell\'avatar.'
    })
  }
})