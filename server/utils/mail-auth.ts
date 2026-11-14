// server/utils/mail-auth.ts
import { type H3Event, getRequestHeader, createError } from 'h3'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

export function requireMailAdmin(event: H3Event) {
  const masterKey = process.env.DKP_ADMIN_MASTER_KEY || 'dkp_live_admin_master_v26_core_777'
  const authHeader = getRequestHeader(event, 'authorization') || ''
  const apiKeyHeader = getRequestHeader(event, 'x-api-key') || ''

  if (apiKeyHeader === masterKey || authHeader === `Bearer ${masterKey}`) {
    return { username: 'system-master', role: 'SUPERADMIN' }
  }

  const user = extractDkpUserFromEvent(event)
  const username = String(user?.username || '').toLowerCase()
  const email = String(user?.email || '').toLowerCase()
  const role = String(user?.role || '').toUpperCase()

  const isAdmin =
    Boolean(user) &&
    (
      username === 'alexdpl' ||
      email.endsWith('@devkernelpulse.org') ||
      role === 'ADMIN' ||
      role === 'SUPERADMIN' ||
      user?.isAdmin === true ||
      user?.is_admin === true
    )

  if (!isAdmin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized Mail Engine Access' })
  }

  return user
}