// server/api/me.ts
import { defineEventHandler } from 'h3'
import { extractDkpUserFromEvent, syncCrossSubdomainSessionCookie } from '~~/server/utils/session'

export default defineEventHandler((event) => {
  const user = extractDkpUserFromEvent(event)

  if (!user) {
    return { success: false, authenticated: false, user: null }
  }

  syncCrossSubdomainSessionCookie(event, user)

  return {
    success: true,
    authenticated: true,
    user
  }
})