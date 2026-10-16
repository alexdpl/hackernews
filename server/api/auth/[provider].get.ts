// server/api/auth/[provider].get.ts
import { defineEventHandler, getRouterParam, setCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider') || 'github'

  const mockSocialProfiles: Record<string, any> = {
    github: {
      id: 1,
      username: 'alexdpl',
      email: 'alexdpl@gmail.com',
      role: 'admin',
      avatar: 'https://github.com/alexdpl.png',
      bio: 'Lead Engineer Architect & Core Creator of DevKernelPulse',
      reputation: 9999,
      xp: 9999,
      authenticated: true
    },
    google: {
      id: 102,
      username: 'alex_google',
      email: 'alexdpl@gmail.com',
      role: 'user',
      avatar: undefined,
      bio: 'Google Verified Developer',
      reputation: 350,
      xp: 350,
      authenticated: true
    },
    gitlab: {
      id: 103,
      username: 'alex_gitlab',
      email: 'alexdpl@gmail.com',
      role: 'user',
      avatar: undefined,
      bio: 'GitLab Verified Developer',
      reputation: 280,
      xp: 280,
      authenticated: true
    },
    linkedin: {
      id: 104,
      username: 'alex_linkedin',
      email: 'alexdpl@live.it',
      role: 'user',
      avatar: undefined,
      bio: 'LinkedIn Professional Developer',
      reputation: 500,
      xp: 500,
      authenticated: true
    }
  }

  const user = mockSocialProfiles[provider] || {
    id: Date.now(),
    username: `dev_${provider}`,
    email: `dev@${provider}.com`,
    role: 'user',
    xp: 150,
    authenticated: true
  }

  // Setta il cookie codificato in JSON in modo sicuro
  setCookie(event, 'dkp_session', encodeURIComponent(JSON.stringify(user)), {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 settimana
  })

  // Reindirizzamento logico: Admin va alla dashboard Admin, User alla sua area.
  const targetUrl = (user.role === 'admin' || user.username === 'alexdpl') ? '/admin' : '/user/dashboard'
  return sendRedirect(event, targetUrl)
})