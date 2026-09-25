// server/api/auth/[provider].get.ts
export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider') || 'github'

  const mockSocialProfiles: Record<string, any> = {
    github: {
      id: 1,
      username: 'alexdpl',
      email: 'alexdpl@gmail.com',
      role: 'admin',
      avatar: 'https://github.com/alexdpl.png',
      bio: 'Lead Architect & Core Creator of DevKernelPulse',
      reputation: 9999,
      authenticated: true,
      loggedAt: new Date().toISOString()
    },
    google: {
      id: 102,
      username: 'alex_google',
      email: 'alexdpl@gmail.com',
      role: 'user',
      avatar: undefined,
      bio: 'Google Verified Developer',
      reputation: 350,
      authenticated: true,
      loggedAt: new Date().toISOString()
    },
    gitlab: {
      id: 103,
      username: 'alex_gitlab',
      email: 'alexdpl@gmail.com',
      role: 'user',
      avatar: undefined,
      bio: 'GitLab Verified Developer',
      reputation: 280,
      authenticated: true,
      loggedAt: new Date().toISOString()
    },
    linkedin: {
      id: 104,
      username: 'alex_linkedin',
      email: 'alexdpl@live.it',
      role: 'user',
      avatar: undefined,
      bio: 'LinkedIn Professional Developer',
      reputation: 500,
      authenticated: true,
      loggedAt: new Date().toISOString()
    }
  }

  const user = mockSocialProfiles[provider] || {
    id: Date.now(),
    username: `dev_${provider}`,
    email: `dev@${provider}.com`,
    role: 'user',
    authenticated: true,
    loggedAt: new Date().toISOString()
  }

  // Cookie DKP Session con httpOnly: false per permettere l'idratazione lato client
  setCookie(event, 'dkp_session', JSON.stringify(user), {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  // Reindirizzamento diretto alla destinazione corretta
  const targetUrl = (user.role === 'admin' || user.username === 'alexdpl') ? '/admin' : '/user/dashboard'
  return sendRedirect(event, targetUrl)
})