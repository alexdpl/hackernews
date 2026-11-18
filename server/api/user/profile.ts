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
    // Assicura campi social e privacy email su users
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS public_email_visible BOOLEAN DEFAULT TRUE;`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_tier VARCHAR(50) DEFAULT 'Junior Kernel';`).catch(() => null)

    const userRes = await db.execute(sql`
      SELECT
        id,
        username,
        email,
        role,
        avatar_url AS avatar,
        COALESCE(bio, '') AS bio,
        COALESCE(xp, 0)::int AS xp,
        github_url AS "githubUrl",
        twitter_url AS "twitterUrl",
        website_url AS "websiteUrl",
        COALESCE(public_email_visible, true) AS "publicEmailVisible",
        reputation_tier AS "reputationTier",
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

    // Conteggi Proof of Work
    let threadsCount = 0
    let blogPostsCount = 0
    let vaultCertsCount = 0

    try {
      const res1 = await db.execute(sql`SELECT COUNT(*)::int AS count FROM node_posts WHERE author_id = ${userId};`)
      threadsCount = Number(extractRows(res1)[0]?.count || 0)
    } catch {}

    try {
      const res2 = await db.execute(sql`SELECT COUNT(*)::int AS count FROM blog_posts WHERE author_id = ${userId};`)
      blogPostsCount = Number(extractRows(res2)[0]?.count || 0)
    } catch {}

    try {
      const res3 = await db.execute(sql`SELECT COUNT(*)::int AS count FROM vault_certs WHERE user_id = ${userId};`)
      vaultCertsCount = Number(extractRows(res3)[0]?.count || 0)
    } catch {}

    const notarizedCodeCount = vaultCertsCount + threadsCount + blogPostsCount

    // Notarizzazioni Vault recenti (SHA-256)
    let vaultCerts: any[] = []
    try {
      const certsRes = await db.execute(sql`
        SELECT id, tool_type AS "toolType", title, hash, created_at AS "createdAt"
        FROM vault_certs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 5;
      `)
      vaultCerts = extractRows(certsRes)
    } catch {}

    // Attività recente (Thread + Blog)
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
    } catch {}

    const recentActivity = userThreads.map((t: any) => ({
      type: 'thread',
      title: `Discussione nel nodo: "${t.title}"`,
      time: t.createdAt ? new Date(t.createdAt).toLocaleDateString('it-IT') : 'Recente'
    }))

    const xp = Number(user.xp || 0)
    const isAdmin = String(user.role || '').toUpperCase() === 'ADMIN'
    const reputationTier = isAdmin || xp >= 10000
      ? 'Architect'
      : xp >= 3000
        ? 'Senior Core'
        : 'Junior Kernel'

    const badges = isAdmin || xp >= 10000
      ? ['Kernel Admin', 'Top Debater', 'Vault Master', 'Architect']
      : xp >= 1000
        ? ['Top Debater', 'Verified Builder']
        : ['Junior Contributor']

    return {
      success: true,
      data: {
        user: {
          id: userId,
          username: user.username,
          email: isSelfOrAdmin || user.publicEmailVisible ? user.email : null,
          role: user.role,
          avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
          bio: user.bio,
          xp,
          reputationTier,
          githubUrl: user.githubUrl || null,
          twitterUrl: user.twitterUrl || null,
          websiteUrl: user.websiteUrl || null,
          publicEmailVisible: user.publicEmailVisible,
          createdAt: user.createdAt,
          level: Math.max(1, Math.floor(xp / 250) + 1),
          badges
        },
        stats: {
          reputationScore: Math.min(99.9, Number((75 + Math.min(24.9, xp / 350)).toFixed(1))),
          notarizedCodeCount,
          threadsCount,
          blogPostsCount,
          vaultCertsCount
        },
        vaultCerts,
        recentActivity
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [USER PROFILE SQL ERROR]:', err?.message)
    throw createError({ statusCode: 500, statusMessage: 'Errore interno recupero profilo.' })
  }
})