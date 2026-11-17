// server/api/auth/me.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  extractDkpUserFromEvent,
  syncCrossSubdomainSessionCookie,
  clearCrossSubdomainSessionCookie
} from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const tokenUser = extractDkpUserFromEvent(event)

  if (!tokenUser || !Number.isSafeInteger(Number(tokenUser.id)) || Number(tokenUser.id) <= 0) {
    return { success: false, authenticated: false, user: null }
  }

  const db = await getDb()
  if (!db) {
    syncCrossSubdomainSessionCookie(event, tokenUser)
    return {
      success: true,
      authenticated: true,
      user: tokenUser
    }
  }

  try {
    const res = await db.execute(sql`
      SELECT
        id,
        username,
        email,
        role,
        COALESCE(xp, 0)::int AS xp,
        avatar_url AS "avatarUrl"
      FROM users
      WHERE id = ${Number(tokenUser.id)}
      LIMIT 1;
    `)

    const dbUser = extractRows(res)[0]
    if (!dbUser) {
      clearCrossSubdomainSessionCookie(event)
      return { success: false, authenticated: false, user: null }
    }

    const role = String(dbUser.role || 'user').toLowerCase()
    const xp = Number(dbUser.xp || 0)
    const avatar =
      dbUser.avatarUrl ||
      tokenUser.avatarUrl ||
      (String(dbUser.username).toLowerCase() === 'alexdpl'
        ? 'https://github.com/alexdpl.png'
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(dbUser.username)}`)

    const freshUser = {
      id: Number(dbUser.id),
      username: dbUser.username,
      email: dbUser.email,
      role,
      isAdmin: role === 'admin',
      avatar,
      avatarUrl: avatar,
      xp,
      level: Math.max(1, Math.floor(xp / 250) + 1)
    }

    syncCrossSubdomainSessionCookie(event, freshUser)

    return {
      success: true,
      authenticated: true,
      user: freshUser
    }
  } catch {
    syncCrossSubdomainSessionCookie(event, tokenUser)
    return {
      success: true,
      authenticated: true,
      user: tokenUser
    }
  }
})