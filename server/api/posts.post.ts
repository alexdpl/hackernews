// server/api/posts.post.ts
import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const sessionCookie = getCookie(event, 'dkp_session')

  if (!body || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio' })
  }

  // 1. Validazione DKP Kernel Captcha
  if (
    body.captchaAnswer === undefined ||
    body.captchaAnswer === null ||
    String(body.captchaAnswer).trim() !== String(body.captchaExpected).trim()
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: '🛡️ DKP Kernel Captcha non valido. Risolvi il quesito di sicurezza.'
    })
  }

  const dbUrl = config.databaseUrl || process.env.DATABASE_URL
  if (!dbUrl) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL assente nel file .env' })
  }

  const sql = neon(dbUrl)

  // 2. Identificazione Utente da DKP Auth Core Session
  let userId = 1
  if (sessionCookie) {
    try {
      const raw = typeof sessionCookie === 'string' ? decodeURIComponent(sessionCookie) : sessionCookie
      const user = typeof raw === 'string' && raw.startsWith('{') ? JSON.parse(raw) : raw
      if (user && user.id) {
        userId = user.id
      }
    } catch {
      // Fallback Admin
    }
  }

  try {
    const title = body.title.trim()
    const url = body.url ? body.url.trim() : null
    const content = body.content ? body.content.trim() : ''
    const type = body.type || 'news' // 'news', 'ask', 'show', 'jobs', 'blog'
    const createdAt = new Date().toISOString()

    // 3. Inserimento SQL con campo 'type' (Sezione) e 'user_id'
    const inserted = await sql`
      INSERT INTO posts (title, url, content, type, user_id, points, created_at)
      VALUES (${title}, ${url}, ${content}, ${type}, ${userId}, 1, ${createdAt})
      RETURNING id, type;
    `

    return {
      success: true,
      message: `✨ Contenuto pubblicato con successo nella sezione [${type.toUpperCase()}]!`,
      id: inserted[0]?.id,
      type: inserted[0]?.type
    }
  } catch (error: any) {
    console.error('Errore Invio Post:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore durante la pubblicazione: ${error.message || error}`
    })
  }
})