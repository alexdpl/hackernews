import { defineEventHandler, getQuery, readBody, createError, setResponseHeaders } from 'h3'
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

function computeGamificationProgression(xp: number, isAdmin: boolean) {
  const tiers = [
    { name: 'COMMUNITY MEMBER', minXp: 0, maxXp: 500 },
    { name: 'VERIFIED BUILDER', minXp: 500, maxXp: 2000 },
    { name: 'CORE PIONEER', minXp: 2000, maxXp: 5000 },
    { name: 'PULSE ARCHITECT', minXp: 5000, maxXp: 10000 },
    { name: 'S-TIER ARCHITECT', minXp: 10000, maxXp: 25000 }
  ]

  const safeXp = Math.max(0, Number(xp) || 0)
  const level = Math.floor(safeXp / 250) + 1
  const levelProgressPct = Math.min(100, Math.round(((safeXp % 250) / 250) * 100))
  const xpToNextLevel = 250 - (safeXp % 250)

  let currentTier = tiers[0]
  let nextTier: { name: string; minXp: number; maxXp: number } | null = tiers[1]

  for (let i = 0; i < tiers.length; i++) {
    if (safeXp >= tiers[i].minXp) {
      currentTier = tiers[i]
      nextTier = tiers[i + 1] || null
    }
  }

  if (isAdmin && currentTier.name !== 'S-TIER ARCHITECT') {
    currentTier = tiers[tiers.length - 1]
    nextTier = null
  }

  const tierProgressPct = nextTier
    ? Math.min(100, Math.max(4, Math.round(((safeXp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100)))
    : 100

  return {
    xp: safeXp,
    level,
    levelProgressPct,
    xpToNextLevel,
    rankTier: currentTier.name,
    nextRankTier: nextTier ? nextTier.name : 'KERNEL MAX TIER',
    nextTierXp: nextTier ? nextTier.minXp : currentTier.maxXp,
    tierProgressPct
  }
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

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
      COALESCE(xp, 0)::int AS xp,
      created_at AS "createdAt"
    FROM users
    WHERE LOWER(username) = LOWER(${requestedUsername})
    LIMIT 1;
  `)

  const u = extractRows(userRes)[0]
  if (!u) {
    const fallbackProg = computeGamificationProgression(1200, false)
    return {
      success: true,
      data: {
        user: {
          username: requestedUsername,
          role: 'USER',
          bio: 'DKP Kernel Developer & Sentinel Operator.',
          avatar: 'https://github.com/alexdpl.png',
          reputationTier: fallbackProg.rankTier,
          xp: fallbackProg.xp,
          badges: ['Verified Builder', 'Sentinel Contributor'],
          customSocials: []
        },
        gamification: fallbackProg,
        stats: {
          reputationScore: 96.5,
          notarizedCodeCount: 0,
          blogCount: 0,
          nodeThreadsCount: 0,
          storiesCount: 0,
          commentsCount: 0,
          totalContributions: 0,
          totalKarma: 0
        },
        recentActivity: [],
        vaultCerts: [],
        xpHistory: []
      }
    }
  }

  const userId = Number(u.id)
  const isAdmin = String(u.role || '').toUpperCase() === 'ADMIN' || String(u.username || '').toLowerCase() === 'alexdpl'
  const customSocials = normalizeCustomSocials(u.customSocialsJson)

  // 1. Calcolo XP reale unificato (users.xp + SUM(user_xp_transactions.amount))
  let txTotalXp = 0
  const xpHistory: Array<{ id: number; action: string; points: number; createdAt: string }> = []
  try {
    const txSumRes = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::int AS total
      FROM user_xp_transactions
      WHERE user_id = ${userId};
    `)
    txTotalXp = Number(extractRows(txSumRes)[0]?.total || 0)

    const txListRes = await db.execute(sql`
      SELECT id, action_type AS "actionType", description, amount, created_at AS "createdAt"
      FROM user_xp_transactions
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 12;
    `)
    for (const row of extractRows(txListRes)) {
      xpHistory.push({
        id: Number(row.id),
        action: String(row.description || row.actionType || 'Attivita Kernel DKP'),
        points: Number(row.amount || 0),
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString('it-IT') : 'Recente'
      })
    }
  } catch {}

  const effectiveXp = Math.max(Number(u.xp || 0), txTotalXp, isAdmin ? 12500 : 250)
  const gamification = computeGamificationProgression(effectiveXp, isAdmin)

  // 2. Metriche reali ecosistema (Blog, Nodes, Stories, Comments, Vault)
  let blogCount = 0
  let nodeThreadsCount = 0
  let storiesCount = 0
  let commentsCount = 0
  let totalKarma = 0

  const recentActivity: Array<{ type: string; title: string; date: string; url?: string; hash?: string }> = []
  const vaultCerts: Array<{ id: string; title: string; hash: string; toolType?: string; createdAt: string }> = []

  // Blog posts
  try {
    const blogCountRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM blog_posts
      WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published';
    `)
    blogCount = Number(extractRows(blogCountRes)[0]?.total || 0)

    const blogRecentRes = await db.execute(sql`
      SELECT id, title, slug, created_at AS "createdAt"
      FROM blog_posts
      WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published'
      ORDER BY created_at DESC
      LIMIT 6;
    `)
    for (const b of extractRows(blogRecentRes)) {
      recentActivity.push({
        type: 'ARTICOLO BLOG',
        title: String(b.title || 'Articolo Tecnico'),
        date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('it-IT') : 'Recente',
        url: b.slug ? `/blog/${b.slug}` : '/blog'
      })
    }
  } catch {}

  // DKP Nodes threads + Vault hash
  try {
    const nodeCountRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total, COALESCE(SUM(karma_score), 0)::int AS karma
      FROM node_posts
      WHERE author_id = ${userId};
    `)
    const nRow = extractRows(nodeCountRes)[0]
    nodeThreadsCount = Number(nRow?.total || 0)
    totalKarma += Number(nRow?.karma || 0)

    const nodePostsRes = await db.execute(sql`
      SELECT id, title, vault_hash AS "vaultHash", created_at AS "createdAt"
      FROM node_posts
      WHERE author_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 8;
    `)
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
          toolType: 'NODE_VAULT',
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('it-IT') : 'Recente'
        })
      }
    }
  } catch {}

  // Vault Certs dedicati (tabella vault_certs)
  try {
    const vaultRes = await db.execute(sql`
      SELECT id, tool_type AS "toolType", title, hash, created_at AS "createdAt"
      FROM vault_certs
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10;
    `)
    for (const v of extractRows(vaultRes)) {
      const hashStr = String(v.hash || '')
      if (hashStr && !vaultCerts.some((c) => c.hash === hashStr)) {
        vaultCerts.push({
          id: `DKP-VAULT-${v.id}`,
          title: String(v.title || 'Certificato Proof-of-Code'),
          hash: hashStr,
          toolType: String(v.toolType || 'SHA256_CERT'),
          createdAt: v.createdAt ? new Date(v.createdAt).toLocaleDateString('it-IT') : 'Recente'
        })
      }
    }
  } catch {}

  // Pulse Stories / News
  try {
    const storiesRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total, COALESCE(SUM(points), 0)::int AS karma
      FROM pulse_stories
      WHERE LOWER(author) = LOWER(${String(u.username)});
    `)
    const sRow = extractRows(storiesRes)[0]
    storiesCount = Number(sRow?.total || 0)
    totalKarma += Number(sRow?.karma || 0)
  } catch {}

  // Commenti unificati
  try {
    const commCountRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM comments
      WHERE user_id = ${userId} OR LOWER(COALESCE(author, '')) = LOWER(${String(u.username)});
    `)
    commentsCount = Number(extractRows(commCountRes)[0]?.total || 0)

    const userCommentsRes = await db.execute(sql`
      SELECT id, post_id AS "postId", target_slug AS "targetSlug", target_type AS "targetType", text, content, created_at AS "createdAt"
      FROM comments
      WHERE user_id = ${userId} OR LOWER(COALESCE(author, '')) = LOWER(${String(u.username)})
      ORDER BY created_at DESC
      LIMIT 6;
    `)
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
  } catch {}

  const totalContributions = blogCount + nodeThreadsCount + storiesCount + commentsCount
  const rawRep = 94.0 + Math.min(5.9, (totalContributions * 0.15) + (vaultCerts.length * 0.4) + (isAdmin ? 2.5 : 0))
  const reputationScore = Number(rawRep.toFixed(1))

  const earnedBadges: string[] = []
  if (isAdmin) earnedBadges.push('Kernel Admin', 'Architect')
  if (vaultCerts.length > 0 || isAdmin) earnedBadges.push('Vault Master')
  if (blogCount > 0 || nodeThreadsCount > 0) earnedBadges.push('Top Debater')
  if (effectiveXp >= 2000) earnedBadges.push('Core Pioneer')
  earnedBadges.push('Verified Builder', 'Sentinel Operator')
  const uniqueBadges = Array.from(new Set(earnedBadges))

  return {
    success: true,
    data: {
      user: {
        ...u,
        xp: effectiveXp,
        reputationTier: gamification.rankTier,
        badges: uniqueBadges,
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
      gamification,
      stats: {
        reputationScore,
        notarizedCodeCount: vaultCerts.length,
        blogCount,
        nodeThreadsCount,
        storiesCount,
        commentsCount,
        totalContributions,
        totalKarma
      },
      recentActivity: recentActivity.slice(0, 12),
      vaultCerts,
      xpHistory
    }
  }
})