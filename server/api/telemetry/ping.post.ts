import crypto from 'node:crypto'
import { defineEventHandler, getRequestHeader, readBody } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import * as sessionUtils from '~~/server/utils/session'

export interface ActiveSessionRecord {
  sessionKey: string
  ip: string
  os: string
  device: string
  browser: string
  path: string
  username: string
  isAuthenticated: boolean
  lastSeenMs: number
}

const globalSessions = ((globalThis as any).__dkpLiveSessions ||= new Map<string, ActiveSessionRecord>()) as Map<string, ActiveSessionRecord>

function parseUserAgent(uaRaw: string) {
  const ua = uaRaw || ''

  // OS detection
  let os = 'Unknown OS'
  if (/Windows NT 10\.0|Windows NT 11\.0/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS / iPadOS'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/Ubuntu/i.test(ua)) os = 'Ubuntu Linux'
  else if (/Linux/i.test(ua)) os = 'Linux'

  // Device detection
  let device = 'Desktop'
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) device = 'Tablet'
  else if (/Mobile|iPhone|Android.*Mobile|Windows Phone/i.test(ua)) device = 'Mobile'
  else if (/bot|crawler|spider|curl|python/i.test(ua)) device = 'Bot / CLI'

  // Browser detection
  let browser = 'Browser'
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera'
  else if (/Brave/i.test(ua)) browser = 'Brave'
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox'
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Google Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari'
  else if (/curl/i.test(ua)) browser = 'cURL CLI'

  return { os, device, browser }
}

async function resolveUser(event: any) {
  const s = sessionUtils as Record<string, any>
  const fn = s.getSessionUser || s.getUserSession || s.getDkpSessionUser || s.getAuthUser || s.verifySession
  if (typeof fn === 'function') {
    const res = await fn(event).catch(() => null)
    return res?.user || res || null
  }
  return event.context?.user || null
}

export function getLiveOnlineSessions(): ActiveSessionRecord[] {
  const now = Date.now()
  const cutoff = now - 5 * 60 * 1000 // Ultimi 5 minuti
  for (const [k, v] of globalSessions.entries()) {
    if (v.lastSeenMs < cutoff) globalSessions.delete(k)
  }
  return Array.from(globalSessions.values()).sort((a, b) => b.lastSeenMs - a.lastSeenMs)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const path = String(body?.path || '/').slice(0, 180)
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  const realIp = getRequestHeader(event, 'x-real-ip')
  const socketIp = event.node?.req?.socket?.remoteAddress
  const ip = String(forwarded?.split(',')[0] || realIp || socketIp || '127.0.0.1').replace(/^::ffff:/, '').trim()

  const ua = String(getRequestHeader(event, 'user-agent') || '')
  const { os, device, browser } = parseUserAgent(ua)
  const user = await resolveUser(event)

  const username = user?.username ? `@${user.username}` : 'Guest Visitor'
  const sessionKey = crypto.createHash('sha256').update(`${ip}|${ua}|${username}`).digest('hex').slice(0, 24)

  const record: ActiveSessionRecord = {
    sessionKey,
    ip,
    os,
    device,
    browser,
    path,
    username,
    isAuthenticated: Boolean(user?.id),
    lastSeenMs: Date.now()
  }

  globalSessions.set(sessionKey, record)

  // Persistenza leggera anche su Pure SQL (non bloccante)
  Promise.resolve(getDb()).then(async (db) => {
    if (!db) return
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS dkp_active_sessions (
        session_key VARCHAR(64) PRIMARY KEY,
        ip_address VARCHAR(80),
        os_name VARCHAR(80),
        device_type VARCHAR(40),
        browser_name VARCHAR(80),
        current_path VARCHAR(200),
        username VARCHAR(100),
        is_authenticated BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMPTZ DEFAULT NOW()
      );
    `).catch(() => null)

    await db.execute(sql`
      INSERT INTO dkp_active_sessions (
        session_key, ip_address, os_name, device_type, browser_name, current_path, username, is_authenticated, last_seen
      ) VALUES (
        ${sessionKey}, ${ip}, ${os}, ${device}, ${browser}, ${path}, ${username}, ${Boolean(user?.id)}, NOW()
      )
      ON CONFLICT (session_key) DO UPDATE SET
        ip_address = EXCLUDED.ip_address,
        os_name = EXCLUDED.os_name,
        device_type = EXCLUDED.device_type,
        browser_name = EXCLUDED.browser_name,
        current_path = EXCLUDED.current_path,
        username = EXCLUDED.username,
        is_authenticated = EXCLUDED.is_authenticated,
        last_seen = NOW();
    `).catch(() => null)
  }).catch(() => null)

  return { ok: true }
})