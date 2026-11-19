import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

async function ensureUserSocialColumns(db: any) {
  const alters = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS repository_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS public_email_visible BOOLEAN DEFAULT TRUE;`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_tier VARCHAR(50) DEFAULT 'Junior Kernel';`
  ]
  for (const stmt of alters) {
    await db.execute(stmt).catch(() => null)
  }
}

export default defineEventHandler(async (event) => {
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  await ensureUserSocialColumns(db)
  const method = event.method.toUpperCase()
  const sessionUser = extractDkpUserFromEvent(event)

  // UPDATE PROFILO (PUT)
  if (method === 'PUT' || method === 'POST') {
    const body = await readBody(event)
    const targetUsername = String(sessionUser?.username || body?.username || '').trim().replace(/^@+/, '')
    if (!targetUsername) {
      throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta per aggiornare il profilo.' })
    }

    const avatar = String(body?.avatar || '').trim() || null
    const bio = String(body?.bio || '').trim()
    const github = String(body?.github || body?.githubUrl || '').trim() || null
    const twitter = String(body?.twitter || body?.twitterUrl || '').trim() || null
    const linkedin = String(body?.linkedin || body?.linkedinUrl || '').trim() || null
    const reddit = String(body?.reddit || body?.redditUrl || '').trim() || null
    const discord = String(body?.discord || body?.discordUrl || '').trim() || null
    const telegram = String(body?.telegram || body?.telegramUrl || '').trim() || null
    const youtube = String(body?.youtube || body?.youtubeUrl || '').trim() || null
    const repository = String(body?.repository || body?.repositoryUrl || '').trim() || null
    const website = String(body?.website || body?.websiteUrl || '').trim() || null

    await db.execute(sql`
      UPDATE users
      SET
        avatar_url = COALESCE(${avatar}, avatar_url),
        bio = ${bio},
        github_url = ${github},
        twitter_url = ${twitter},
        linkedin_url = ${linkedin},
        reddit_url = ${reddit},
        discord_url = ${discord},
        telegram_url = ${telegram},
        youtube_url = ${youtube},
        repository_url = ${repository},
        website_url = ${website}
      WHERE LOWER(username) = LOWER(${targetUsername});
    `)

    return { success: true, message: 'Profilo e link social aggiornati su Pure SQL.' }
  }

  // LETTURA PROFILO (GET)
  const query = getQuery(event)
  const requestedUsername = String(query.username || sessionUser?.username || 'alexdpl').trim().replace(/^@+/, '')

  const userRes = await db.execute(sql`
    SELECT
      id, username, email, role,
      avatar_url AS avatar,
      COALESCE(bio, '') AS bio,
      COALESCE(xp, 0)::int AS xp,
      github_url AS "githubUrl",
      twitter_url AS "twitterUrl",
      linkedin_url AS "linkedinUrl",
      reddit_url AS "redditUrl",
      discord_url AS "discordUrl",
      telegram_url AS "telegramUrl",
      youtube_url AS "youtubeUrl",
      repository_url AS "repositoryUrl",
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
    throw createError({ statusCode: 404, statusMessage: 'Utente non trovato.' })
  }

  const userId = Number(user.id)
  const isAdmin = String(user.role || '').toUpperCase() === 'ADMIN'
  const xp = Number(user.xp || 0)

  let threadsCount = 0
  let blogPostsCount = 0
  let vaultCertsCount = 0
  let vaultCerts: any[] = []
  let recentActivity: any[] = []

  try {
    const r1 = await db.execute(sql`SELECT COUNT(*)::int AS c FROM node_posts WHERE author_id = ${userId};`)
    threadsCount = Number(extractRows(r1)[0]?.c || 0)
    const r2 = await db.execute(sql`SELECT COUNT(*)::int AS c FROM blog_posts WHERE author_id = ${userId};`)
    blogPostsCount = Number(extractRows(r2)[0]?.c || 0)
    const r3 = await db.execute(sql`SELECT COUNT(*)::int AS c FROM vault_certs WHERE user_id = ${userId};`)
    vaultCertsCount = Number(extractRows(r3)[0]?.c || 0)

    const cRes = await db.execute(sql`
      SELECT id, title, hash, created_at AS "createdAt"
      FROM vault_certs WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 6;
    `)
    vaultCerts = extractRows(cRes)

    const tRes = await db.execute(sql`
      SELECT id, title, created_at AS "createdAt"
      FROM node_posts WHERE author_id = ${userId} ORDER BY created_at DESC LIMIT 6;
    `)
    recentActivity = extractRows(tRes).map((t: any) => ({
      id: t.id,
      type: 'thread',
      title: `Discussione nel nodo: "${t.title}"`,
      time: t.createdAt ? new Date(t.createdAt).toLocaleDateString('it-IT') : 'Recente'
    }))
  } catch {}

  const reputationTier = isAdmin || xp >= 10000 ? 'Architect' : xp >= 3000 ? 'Senior Core' : 'Junior Kernel'
  const badges = isAdmin || xp >= 10000
    ? ['Kernel Admin', 'Top Debater', 'Vault Master', 'Architect']
    : xp >= 1000
      ? ['Top Debater', 'Verified Builder']
      : ['Junior Contributor']

  return {
    success: true,
    data: {
      user: {
        ...user,
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
        xp,
        reputationTier,
        level: Math.max(1, Math.floor(xp / 250) + 1),
        badges
      },
      stats: {
        reputationScore: Math.min(99.9, Number((75 + Math.min(24.9, xp / 350)).toFixed(1))),
        notarizedCodeCount: vaultCertsCount + threadsCount + blogPostsCount,
        threadsCount,
        blogPostsCount,
        vaultCertsCount
      },
      vaultCerts,
      recentActivity
    }
  }
})