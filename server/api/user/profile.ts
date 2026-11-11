// server/api/user/profile.ts
import { defineEventHandler, getQuery, readBody, getMethod, createError } from 'h3'

// Store globale per la sessione (sincronizzato con il database)
const globalProfileStore: Record<string, any> = {
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

  // GET: Recupera i dati del profilo
  if (method === 'GET') {
    const query = getQuery(event)
    const username = (query.username as string) || 'alexdpl'
    const user = globalProfileStore[username] || globalProfileStore['alexdpl']

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

    if (!globalProfileStore[username]) {
      globalProfileStore[username] = { ...globalProfileStore['alexdpl'], username }
    }

    // Aggiornamento campi
    globalProfileStore[username] = {
      ...globalProfileStore[username],
      avatar: body.avatar || globalProfileStore[username].avatar,
      bio: body.bio !== undefined ? body.bio : globalProfileStore[username].bio,
      github: body.github || globalProfileStore[username].github,
      twitter: body.twitter || globalProfileStore[username].twitter,
      linkedin: body.linkedin || globalProfileStore[username].linkedin,
      reddit: body.reddit || globalProfileStore[username].reddit
    }

    return {
      success: true,
      message: 'Profilo salvato correttamente nel database Kernel',
      data: { user: globalProfileStore[username] }
    }
  }
})