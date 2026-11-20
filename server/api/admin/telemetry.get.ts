import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { resolveNewsTable } from '~~/server/utils/dkpNewsRepo'
import { getLiveOnlineSessions } from '~~/server/api/telemetry/ping.post'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const t0 = Date.now()
  const db = await getDb()
  const newsMeta = await resolveNewsTable()
  const newsTable = newsMeta?.tableName || 'news'

  let dbLatencyMs = 0
  let usersCount = 0
  let newsTotal = 0
  let jobsTotal = 0
  let askTotal = 0
  let showTotal = 0
  let blogTotal = 0
  let nodesTotal = 0
  let commentsTotal = 0
  let adsTotal = 0
  let vaultTotal = 0
  let bountiesTotal = 0
  let quarantinedCount = 0
  let nodesList: any[] = []
  let apiKeysList: any[] = []
  let sqlSessions: any[] = []

  if (db) {
    const q = async (query: any) => extractRows(await db.execute(query).catch(() => []))

    const [
      uRows,
      nRows,
      jRows,
      aRows,
      sRows,
      bRows,
      npRows,
      ncRows,
      adRows,
      vRows,
      bnRows,
      qRows,
      nodesData,
      keysData,
      sessData
    ] = await Promise.all([
      q(sql`SELECT COUNT(*)::int AS c FROM users;`),
      q(sql.raw(`SELECT COUNT(*)::int AS c FROM "${newsTable}";`)),
      q(sql.raw(`SELECT COUNT(*)::int AS c FROM "${newsTable}" WHERE LOWER(COALESCE(feed_channel, type, '')) IN ('job','jobs') OR COALESCE(source_provider,'') IN ('DATAPIZZA_IT','TECHCOMPENSO_IT');`)),
      q(sql.raw(`SELECT COUNT(*)::int AS c FROM "${newsTable}" WHERE LOWER(COALESCE(feed_channel, type, '')) = 'ask' OR title ILIKE 'Ask %';`)),
      q(sql.raw(`SELECT COUNT(*)::int AS c FROM "${newsTable}" WHERE LOWER(COALESCE(feed_channel, type, '')) = 'show' OR title ILIKE 'Show %' OR COALESCE(source_provider,'') IN ('GITHUB','GITLAB');`)),
      q(sql`SELECT COUNT(*)::int AS c FROM blog_posts;`),
      q(sql`SELECT COUNT(*)::int AS c FROM node_posts;`),
      q(sql`SELECT COUNT(*)::int AS c FROM node_comments;`),
      q(sql`SELECT COUNT(*)::int AS c FROM dkp_ads;`),
      q(sql`SELECT COUNT(*)::int AS c FROM vault_hashes;`),
      q(sql`SELECT COUNT(*)::int AS c FROM bounties;`),
      q(sql`SELECT COUNT(*)::int AS c FROM users WHERE COALESCE(is_banned, false) = true OR COALESCE(shadowbanned, false) = true;`),
      q(sql`SELECT id, slug, name, description FROM nodes ORDER BY id ASC LIMIT 30;`),
      q(sql`SELECT id, name, key_prefix, tier, is_active, created_at FROM api_keys ORDER BY created_at DESC LIMIT 20;`),
      q(sql`SELECT session_key, ip_address, os_name, device_type, browser_name, current_path, username, is_authenticated, EXTRACT(EPOCH FROM (NOW() - last_seen))::int AS age_sec FROM dkp_active_sessions WHERE last_seen > NOW() - INTERVAL '5 minutes' ORDER BY last_seen DESC LIMIT 50;`)
    ])

    dbLatencyMs = Date.now() - t0
    usersCount = Number(uRows[0]?.c || 0)
    newsTotal = Number(nRows[0]?.c || 0)
    jobsTotal = Number(jRows[0]?.c || 0)
    askTotal = Number(aRows[0]?.c || 0)
    showTotal = Number(sRows[0]?.c || 0)
    blogTotal = Number(bRows[0]?.c || 0)
    nodesTotal = Number(npRows[0]?.c || 0)
    commentsTotal = Number(ncRows[0]?.c || 0)
    adsTotal = Number(adRows[0]?.c || 0)
    vaultTotal = Number(vRows[0]?.c || 0)
    bountiesTotal = Number(bnRows[0]?.c || 0)
    quarantinedCount = Number(qRows[0]?.c || 0)
    nodesList = nodesData
    apiKeysList = keysData
    sqlSessions = sessData
  }

  // Merge sessioni in memoria + Pure SQL
  const memSessions = getLiveOnlineSessions().map((s) => ({
    sessionKey: s.sessionKey,
    ip: s.ip,
    os: s.os,
    device: s.device,
    browser: s.browser,
    path: s.path,
    username: s.username,
    isAuthenticated: s.isAuthenticated,
    ageSec: Math.max(0, Math.round((Date.now() - s.lastSeenMs) / 1000))
  }))

  const byKey = new Map<string, any>()
  for (const s of memSessions) byKey.set(s.sessionKey, s)
  for (const r of sqlSessions) {
    if (!byKey.has(r.session_key)) {
      byKey.set(r.session_key, {
        sessionKey: r.session_key,
        ip: r.ip_address,
        os: r.os_name,
        device: r.device_type,
        browser: r.browser_name,
        path: r.current_path,
        username: r.username,
        isAuthenticated: Boolean(r.is_authenticated),
        ageSec: Number(r.age_sec || 0)
      })
    }
  }

  const onlineUsers = Array.from(byKey.values()).sort((a, b) => a.ageSec - b.ageSec)

  return {
    success: true,
    dbLatencyMs,
    newsTable,
    kpi: {
      usersCount,
      newsTotal,
      jobsTotal,
      askTotal,
      showTotal,
      blogTotal,
      nodesTotal,
      commentsTotal,
      adsTotal,
      vaultTotal,
      bountiesTotal,
      quarantinedCount
    },
    onlineUsers,
    nodesList,
    apiKeysList
  }
})