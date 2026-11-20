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
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_socials_json TEXT;`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS public_email_visible BOOLEAN DEFAULT TRUE;`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_tier VARCHAR(50) DEFAULT 'Junior Kernel';`
  ]
  for (const stmt of alters) {
    await db.execute(stmt).catch(() => null)
  }
}

function normalizeCustomSocials(raw: any): Array<{ platform: string; label: string; url: string }> {
  let list: any[] = []
  if (Array.isArray(raw)) {
    list = raw
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) list = parsed
    } catch {
      list = []
    }
  }
  return list
    .map((item: any) => ({
      platform: String(item?.platform || 'website').trim(),
      label: String(item?.label || item?.platform || 'Link').trim(),
      url: String(item?.url || '').trim()
    }))
    .filter((item) => item.url.length > 0)
}

export default defineEventHandler(async (event) => {
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  await ensureUserSocialColumns(db)
  const method = event.method.toUpperCase()
  const sessionUser = extractDkpUserFromEvent(event)

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
    const customSocials = normalizeCustomSocials(body?.customSocials ?? body?.custom_socials_json)
    const customSocialsJson = JSON.stringify(customSocials)

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
        website_url = ${website},
        custom_socials_json = ${customSocialsJson}
      WHERE LOWER(username) = LOWER(${targetUsername});
    `)

    return {
      success: true,
      message: 'Profilo e link social aggiornati su Pure SQL.',
      customSocials
    }
  }

  const query = getQuery(event)
  const requestedUsername = String(query.username || sessionUser?.username || 'alexdpl').trim().replace(/^@+/, '')

  const userRes = await db.execute(sql`
    SELECT
      id,
      username,
      email,
      role,
      bio,
      avatar_url AS "avatar",
      github_url AS "githubUrl",
      twitter_url AS "twitterUrl",
      linkedin_url AS "linkedinUrl",
      reddit_url AS "redditUrl",
      discord_url AS "discordUrl",
      telegram_url AS "telegramUrl",
      youtube_url AS "youtubeUrl",
      repository_url AS "repositoryUrl",
      website_url AS "websiteUrl",
      custom_socials_json AS "customSocialsJson",
      COALESCE(reputation_tier, 'Architect') AS "reputationTier",
      COALESCE(xp, 12500) AS xp
    FROM users
    WHERE LOWER(username) = LOWER(${requestedUsername})
    LIMIT 1;
  `)

  const u = extractRows(userRes)[0]
  if (!u) {
    return {
      success: true,
      data: {
        user: {
          username: requestedUsername,
          role: 'USER',
          bio: 'DKP Kernel Developer & Sentinel Operator.',
          avatar: 'https://github.com/alexdpl.png',
          reputationTier: 'Developer',
          xp: 1200,
          customSocials: []
        },
        stats: { reputationScore: 98.4, notarizedCodeCount: 0 },
        recentActivity: [],
        vaultCerts: []
      }
    }
  }

  const customSocials = normalizeCustomSocials(u.customSocialsJson)

  const recentActivity: Array<{ type: string; title: string; date: string; url?: string; hash?: string }> = []
  const vaultCerts: Array<{ id: string; title: string; hash: string; createdAt: string }> = []

  const nodePostsRes = await db.execute(sql`
    SELECT id, title, vault_hash AS "vaultHash", created_at AS "createdAt"
    FROM node_posts
    WHERE author_id = ${Number(u.id)}
    ORDER BY created_at DESC
    LIMIT 8;
  `).catch(() => null)
  for (const r of extractRows(nodePostsRes)) {
    recentActivity.push({
      type: 'NODE THREAD',
      title: String(r.title || 'Discussione Nodo'),
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('it-IT') : 'Recente',
      url: `/nodes/thread/${r.id}`,
      hash: r.vaultHash ? String(r.vaultHash) : undefined
    })
    if (r.vaultHash) {
      vaultCerts.push({
        id: `DKP-NODE-${r.id}`,
        title: String(r.title || 'Thread Notarizzato'),
        hash: String(r.vaultHash),
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('it-IT') : 'Recente'
      })
    }
  }

  const userCommentsRes = await db.execute(sql`
    SELECT id, post_id AS "postId", target_slug AS "targetSlug", target_type AS "targetType", text, content, created_at AS "createdAt"
    FROM comments
    WHERE user_id = ${Number(u.id)} OR LOWER(COALESCE(author, '')) = LOWER(${String(u.username)})
    ORDER BY created_at DESC
    LIMIT 8;
  `).catch(() => null)
  for (const c of extractRows(userCommentsRes)) {
    const snippet = String(c.text || c.content || '').trim()
    const tType = String(c.targetType || 'hn').toLowerCase()
    const targetUrl =
      tType === 'blog' && c.targetSlug
        ? `/blog/${c.targetSlug}`
        : tType === 'node' && Number(c.postId) > 0
          ? `/nodes/thread/${c.postId}`
          : c.targetSlug
            ? `/news/${c.targetSlug}`
            : '/news'
    recentActivity.push({
      type: `COMMENTO ${tType.toUpperCase()}`,
      title: snippet.length > 90 ? `${snippet.slice(0, 90)}...` : (snippet || 'Commento pubblicato'),
      date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('it-IT') : 'Recente',
      url: targetUrl
    })
  }

  return {
    success: true,
    data: {
      user: {
        ...u,
        github: u.githubUrl || '',
        twitter: u.twitterUrl || '',
        linkedin: u.linkedinUrl || '',
        reddit: u.redditUrl || '',
        discord: u.discordUrl || '',
        telegram: u.telegramUrl || '',
        youtube: u.youtubeUrl || '',
        repository: u.repositoryUrl || '',
        website: u.websiteUrl || '',
        customSocials
      },
      stats: {
        reputationScore: 99.1,
        notarizedCodeCount: vaultCerts.length
      },
      recentActivity,
      vaultCerts
    }
  }
})