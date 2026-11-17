// server/api/user/profile.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionUser = extractDkpUserFromEvent(event)

  const requestedUsername = String(query.username || sessionUser?.username || 'alexdpl')
    .trim()
    .replace(/^@+/, '')

  if (!requestedUsername || requestedUsername.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Username non valido.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  try {
    // 1. Recupera l'utente dal DB (senza mai esporre password_hash)
    const userRes = await db.execute(sql`
      SELECT
        id,
        username,
        email,
        role,
        avatar_url AS avatar,
        COALESCE(bio, '') AS bio,
        COALESCE(xp, 0)::int AS xp,
        github,
        twitter,
        linkedin,
        reddit,
        created_at AS "createdAt"
      FROM users
      WHERE LOWER(username) = LOWER(${requestedUsername})
      LIMIT 1;
    `)
    const user = extractRows(userRes)[0]

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Utente non trovato nel Kernel DKP.' })
    }

    const userId = Number(user.id)
    const isSelfOrAdmin =
      Boolean(sessionUser?.id) &&
      (Number(sessionUser?.id) === userId || String(sessionUser?.role || '').toLowerCase() === 'admin')

    // 2. Conta thread reali su node_posts e articoli pubblicati su blog_posts
    let threadsCount = 0
    let blogPostsCount = 0

    try {
      const threadsCountRes = await db.execute(sql`
        SELECT COUNT(*)::int AS count FROM node_posts WHERE author_id = ${userId};
      `)
      threadsCount = Number(extractRows(threadsCountRes)[0]?.count || 0)
    } catch {}

    try {
      const blogCountRes = await db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM blog_posts
        WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published';
      `)
      blogPostsCount = Number(extractRows(blogCountRes)[0]?.count || 0)
    } catch {}

    const notarizedCodeCount = threadsCount + blogPostsCount

    // 3. Recupera i thread recenti nei DKP Nodes
    let userThreads: any[] = []
    try {
      const threadsRes = await db.execute(sql`
        SELECT id, title, created_at AS "createdAt"
        FROM node_posts
        WHERE author_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 5;
      `)
      userThreads = extractRows(threadsRes)
    } catch {
      userThreads = []
    }

    const recentActivity = userThreads.length > 0
      ? userThreads.map((t: any) => ({
          type: 'thread',
          title: `Discussione aperta: "${t.title}"`,
          time: t.createdAt ? new Date(t.createdAt).toLocaleDateString('it-IT') : 'Recente'
        }))
      : [{ type: 'system', title: 'Registrato nel Kernel DevKernelPulse v2.6', time: 'Recente' }]

    const xp = Number(user.xp || 0)
    const isAdmin = String(user.role || '').toUpperCase() === 'ADMIN'
    const rankTier = isAdmin || xp >= 10000
      ? 'S-TIER ARCHITECT'
      : xp >= 2500
        ? 'KERNEL CORE'
        : xp >= 500
          ? 'VERIFIED BUILDER'
          : 'COMMUNITY MEMBER'

    const badges = isAdmin || xp >= 10000
      ? ['Developer VIP Member', 'Early Pioneer', 'Core Creator', 'Vault Master']
      : xp >= 500
        ? ['Verified Builder', 'Developer Member']
        : ['Developer Member']

    return {
      success: true,
      data: {
        user: {
          id: userId,
          username: user.username,
          ...(isSelfOrAdmin ? { email: user.email } : {}),
          role: user.role,
          avatar:
            user.avatar ||
            (String(user.username).toLowerCase() === 'alexdpl'
              ? 'https://github.com/alexdpl.png'
              : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`),
          bio: user.bio,
          xp,
          rankTier,
          github: user.github || null,
          twitter: user.twitter || null,
          linkedin: user.linkedin || null,
          reddit: user.reddit || null,
          createdAt: user.createdAt,
          level: Math.max(1, Math.floor(xp / 250) + 1),
          badges
        },
        stats: {
          reputationScore: Math.min(99.9, Number((70 + Math.min(29.9, xp / 400)).toFixed(1))),
          notarizedCodeCount,
          threadsCount,
          blogPostsCount
        },
        recentActivity
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [USER PROFILE SQL ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore interno recupero profilo.'
    })
  }
})