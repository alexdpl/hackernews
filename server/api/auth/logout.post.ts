// server/api/auth/logout.post.ts
import { defineEventHandler } from 'h3'
import { clearCrossSubdomainSessionCookie } from '~~/server/utils/session'

export default defineEventHandler((event) => {
  clearCrossSubdomainSessionCookie(event)

  return {
    success: true,
    message: 'Logout completato e sessione distrutta (DKP v2.6-PURE-SQL).'
  }
})