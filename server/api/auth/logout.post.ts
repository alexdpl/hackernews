// server/api/auth/logout.post.ts
import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'dkp_user', { path: '/' })
  return { success: true }
})