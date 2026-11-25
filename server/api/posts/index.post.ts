// server/api/posts/index.post.ts
import { neon } from '@neondatabase/serverless'
import { runSentinelPipeline } from '~~/server/utils/sentinelNetwork'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const sessionCookie = getCookie(event, 'dkp_session')

  if (!body || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio' })
  }

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

  let userId = 1
  let sessionUser: any = null
  if (sessionCookie) {
    try {
      const raw = typeof sessionCookie === 'string' ? decodeURIComponent(sessionCookie) : sessionCookie
      sessionUser = typeof raw === 'string' && raw.startsWith('{') ? JSON.parse(raw) : raw
      if (sessionUser && sessionUser.id) {
        userId = Number(sessionUser.id)
      }
    } catch {}
  }

  try {
    const title = body.title.trim()
    const url = body.url ? body.url.trim() : null
    const content = body.content ? body.content.trim() : ''
    const type = body.type || 'news'
    const createdAt = new Date().toISOString()

    const inserted = await sql`
      INSERT INTO posts (title, url, content, type, user_id, points, created_at)
      VALUES (${title}, ${url}, ${content}, ${type}, ${userId}, 1, ${createdAt})
      RETURNING id, type;
    `

    const newPostId = Number(inserted[0]?.id)
    if (newPostId > 0) {
      const sentinelTask = runSentinelPipeline({
        targetType: 'post',
        targetId: newPostId,
        postId: newPostId,
        sectionSlug: String(type),
        authorId: userId,
        authorUsername: sessionUser?.username,
        authorEmail: sessionUser?.email,
        authorIsBot: Boolean(sessionUser?.isBot),
        content: `${title}\n${content}`.trim()
      }).catch((err) => console.error('[SENTINEL PIPELINE ERROR]:', err?.message))

      if (typeof (event as any).waitUntil === 'function') {
        ;(event as any).waitUntil(sentinelTask)
      }
    }

    return {
      success: true,
      message: `✨ Contenuto pubblicato con successo nella sezione [${type.toUpperCase()}]!`,
      id: newPostId,
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
