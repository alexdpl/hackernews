// server/api/auth/logout.post.ts
import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  // Elimina sia il nuovo cookie ufficiale che eventuali rimasugli del vecchio
  deleteCookie(event, 'dkp_session', { path: '/' })
  deleteCookie(event, 'dkp_user', { path: '/' })
  
  return { 
    success: true,
    message: 'Logout completato e sessione distrutta (v2.5-GOLD).'
  }
})