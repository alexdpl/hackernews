// server/api/user/profile.ts
import { defineEventHandler, getQuery, readBody, getMethod, createError } from 'h3'

// Store in-memory sincronizzato (sostituibile con query Drizzle / Neon DB)
const profileStore: Record<string, any> = {
  alexdpl: {
    username: 'alexdpl',
    fullName: 'Alex DPL',
    avatar: 'https://github.com/alexdpl.png',
    bio: 'Lead Engineer Architect & Core Creator of DevKernelPulse.',
    github: 'https://github.com/alexdpl',
    twitter: 'https://x.com/alexdpl76',
    linkedin: 'https://linkedin.com/in/alexdpl',
    reddit: 'https://reddit.com/user/alexdpl',
    rankTier: 'S-TIER ARCHITECT',
    role: 'S-TIER ARCHITECT',
    xp: 10860,
    level: 2,
    verified: true,
    badges: ['Developer VIP Member', 'Early Pioneer', 'Core Creator', 'Vault Master']
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // GET: Restituisce il profilo utente
  if (method === 'GET') {
    const query = getQuery(event)
    const username = (query.username as string) || 'alexdpl'
    const user = profileStore[username] || profileStore['alexdpl']

    return {
      success: true,
      data: {
        user,
        stats: { reputationScore: 98.4, notarizedCodeCount: 18 }
      }
    }
  }

  // PUT: Salva i dati inviati dalla Dashboard
  if (method === 'PUT') {
    const body = await readBody(event)
    const username = body.username || 'alexdpl'

    if (!profileStore[username]) {
      profileStore[username] = { ...profileStore['alexdpl'], username }
    }

    profileStore[username] = {
      ...profileStore[username],
      avatar: body.avatar ?? profileStore[username].avatar,
      bio: body.bio ?? profileStore[username].bio,
      github: body.github ?? profileStore[username].github,
      twitter: body.twitter ?? profileStore[username].twitter,
      linkedin: body.linkedin ?? profileStore[username].linkedin,
      reddit: body.reddit ?? profileStore[username].reddit
    }

    return {
      success: true,
      message: 'Profilo aggiornato con successo',
      data: { user: profileStore[username] }
    }
  }
})