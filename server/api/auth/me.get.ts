// server/api/auth/me.get.ts
import { defineEventHandler } from 'h3'
import { extractDkpUserFromEvent, syncCrossSubdomainSessionCookie } from '~~/server/utils/session'

export default defineEventHandler((event) => {
  const user = extractDkpUserFromEvent(event)

  if (!user) {
    return { success: false, authenticated: false, user: null }
  }

  // Promuove automaticamente il cookie al dominio .devkernelpulse.org per abilitare mail.devkernelpulse.org
  syncCrossSubdomainSessionCookie(event, user)

  return {
    success: true,
    authenticated: true,
    user
  }
})