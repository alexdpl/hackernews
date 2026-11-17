// server/utils/userProfile.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function computeRankFromXp(xp: number, isFounder: boolean): { level: number; rankTier: string } {
  if (isFounder || xp >= 10000) return { level: Math.max(2, Math.floor(xp / 2500) + 1), rankTier: 'S-TIER ARCHITECT' }
  if (xp >= 5000) return { level: Math.floor(xp / 1500) + 1, rankTier: 'KERNEL CORE' }
  if (xp >= 1500) return { level: Math.floor(xp / 750) + 1, rankTier: 'SYSTEM CONTRIBUTOR' }
  if (xp >= 300) return { level: Math.floor(xp / 300) + 1, rankTier: 'VERIFIED BUILDER' }
  return { level: 1, rankTier: 'COMMUNITY MEMBER' }
}

export async function fetchUserProfileData(usernameParam: string) {
  const rawUser = String(usernameParam || '').trim() || 'alexdpl'
  const username = rawUser.replace(/^@+/, '').slice(0, 100)
  if (!username) return null

  const db = await getDb()
  if (!db) return null

  // Migrazione non distruttiva (senza sovrascrivere default personali su altri utenti)
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reddit VARCHAR(255);`).catch(() => null)
  } catch {}

  let userRow: any = null
  try {
    const res = await db.execute(sql`
      SELECT
        id,
        username,
        bio,
        role,
        COALESCE(xp, 0)::int AS xp,
        avatar_url AS "avatarUrl",
        github,
        twitter,
        linkedin,
        reddit,
        created_at AS "createdAt"
      FROM users
      WHERE LOWER(username) = LOWER(${username})
      LIMIT 1;
    `)
    userRow = extractRows(res)[0] || null
  } catch {
    userRow = null
  }

  const isFounder = username.toLowerCase() === 'alexdpl'

  // Se l'utente non esiste nel DB (e non è il profilo fondatore), restituisce null -> l'API risponderà 404
  if (!userRow && !isFounder) {
    return null
  }

  const resolvedUsername = userRow?.username || 'alexdpl'
  const userId = userRow?.id ? Number(userRow.id) : null

  // Recupero metriche reali dall'ecosistema DKP
  let storiesKarma = 0
  let storiesCount = 0
  let blogPostsCount = 0
  let talksThreadsCount = 0
  let totalCommentsCount = 0

  try {
    const storiesRes = await db.execute(sql`
      SELECT
        COALESCE(SUM(points), 0)::int AS karma,
        COUNT(*)::int AS total
      FROM pulse_stories
      WHERE LOWER(author) = LOWER(${resolvedUsername});
    `)
    const sRow = extractRows(storiesRes)[0]
    storiesKarma = Number(sRow?.karma || 0)
    storiesCount = Number(sRow?.total || 0)
  } catch {}

  if (userId) {
    try {
      const blogRes = await db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM blog_posts
        WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published';
      `)
      blogPostsCount = Number(extractRows(blogRes)[0]?.total || 0)
    } catch {}

    try {
      const threadsRes = await db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM node_posts
        WHERE author_id = ${userId};
      `)
      talksThreadsCount = Number(extractRows(threadsRes)[0]?.total || 0)
    } catch {}
  }

  try {
    const commentsRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM comments
      WHERE LOWER(author) = LOWER(${resolvedUsername})
        ${userId ? sql`OR user_id = ${userId}` : sql``};
    `)
    totalCommentsCount = Number(extractRows(commentsRes)[0]?.total || 0)
  } catch {}

  const dbXp = Number(userRow?.xp || 0)
  const xpTotal = Math.max(dbXp, storiesKarma * 10, isFounder ? 10860 : 0)
  const { level, rankTier } = computeRankFromXp(xpTotal, isFounder)

  const normalizedRole = String(userRow?.role || (isFounder ? 'ADMIN' : 'USER')).toUpperCase()
  const displayRole = normalizedRole === 'ADMIN' ? 'S-TIER ARCHITECT' : 'Kernel Builder'
  const verified = normalizedRole === 'ADMIN' || xpTotal >= 1500

  // Attività recenti reali dal database
  const recentActivity: Array<{ type: string; title: string; time: string }> = []
  if (userId) {
    try {
      const recentThreadsRes = await db.execute(sql`
        SELECT title, created_at
        FROM node_posts
        WHERE author_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 3;
      `)
      for (const row of extractRows(recentThreadsRes)) {
        recentActivity.push({
          type: 'post',
          title: `Avviata discussione: ${row.title}`,
          time: row.created_at ? new Date(row.created_at).toLocaleDateString('it-IT') : 'Recente'
        })
      }

      const recentBlogsRes = await db.execute(sql`
        SELECT title, created_at
        FROM blog_posts
        WHERE author_id = ${userId} AND COALESCE(status, 'published') = 'published'
        ORDER BY created_at DESC
        LIMIT 2;
      `)
      for (const row of extractRows(recentBlogsRes)) {
        recentActivity.push({
          type: 'vault',
          title: `Pubblicato articolo tecnico: ${row.title}`,
          time: row.created_at ? new Date(row.created_at).toLocaleDateString('it-IT') : 'Recente'
        })
      }
    } catch {}
  }

  const badges: string[] = []
  if (isFounder || normalizedRole === 'ADMIN') {
    badges.push('Core Creator', 'Vault Master', 'Developer VIP Member')
  }
  if (verified) badges.push('Early Pioneer')
  if (blogPostsCount > 0) badges.push('Editorial Author')
  if (talksThreadsCount > 0) badges.push('Talks Contributor')
  if (badges.length === 0) badges.push('DKP Member')

  return {
    user: {
      id: userId,
      username: resolvedUsername,
      fullName: isFounder ? 'Alessandro De Paola' : resolvedUsername,
      bio:
        (userRow?.bio && String(userRow.bio).trim()) ||
        (isFounder
          ? 'Lead Engineer Architect & Core Creator of DevKernelPulse. Building high-performance developer tools, AI workflows and serverless architectures.'
          : 'Membro attivo della community DevKernelPulse.'),
      avatar:
        userRow?.avatarUrl ||
        (isFounder
          ? 'https://github.com/alexdpl.png'
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`),
      role: displayRole,
      xp: xpTotal,
      level,
      rankTier,
      verified,
      vaultHashCount: storiesCount + blogPostsCount + talksThreadsCount,
      createdAt: userRow?.createdAt || new Date().toISOString(),
      badges,
      github: userRow?.github || (isFounder ? 'https://github.com/alexdpl' : null),
      twitter: userRow?.twitter || (isFounder ? 'https://x.com/alexdpl76' : null),
      linkedin: userRow?.linkedin || (isFounder ? 'https://linkedin.com/in/alexdpl' : null),
      reddit: userRow?.reddit || (isFounder ? 'https://reddit.com/user/alexdpl' : null)
    },
    stats: {
      blogPostsCount,
      talksThreadsCount,
      totalCommentsCount,
      reputationScore: Math.min(99.9, Number((70 + Math.min(29.9, xpTotal / 400)).toFixed(1))),
      notarizedCodeCount: blogPostsCount + talksThreadsCount
    },
    recentActivity,
    activeBounties: isFounder
      ? [
          { id: 101, title: 'Refactor componente Captcha equazionale', reward: '500 XP', nodeSlug: 'security', status: 'open' },
          { id: 102, title: 'Ottimizzazione indici SQL su Neon DB', reward: '1200 XP', nodeSlug: 'dev', status: 'open' }
        ]
      : []
  }
}