// server/api/auth/me.get.ts
import { defineEventHandler, getCookie } from 'h3'

export default defineEventHandler((event) => {
  const username = getCookie(event, 'dkp_user')
  return {
    authenticated: !!username,
    username: username || null
  }
})