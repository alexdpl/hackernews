// server/api/user/profile.ts
import { defineEventHandler, getMethod, getQuery, readBody, createError } from 'h3'

// Store in-memory sincronizzato (da sostituire o affiancare alla tabella 'users' su Neon DB)
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

  // ----------------------------------------------------
  // 1. GESTIONE GET: Lettura Profilo Utente
  // ----------------------------------------------------
  if (method === 'GET') {
    const query = getQuery(event)
    const username = (query.username as string) || 'alexdpl'

    // Recupera l'utente o applica il fallback sul profilo di default
    const userRaw = globalProfileStore[username] || globalProfileStore['alexdpl']

    // Normalizzazione restrittiva dei dati per evitare campi corrotti
    const user = {
      ...userRaw,
      bio: userRaw.bio ?? 'Lead Engineer Architect & Core Creator of DevKernelPulse.',
      avatar: userRaw.avatar || 'https://github.com/alexdpl.png',
      // Garantisce che badges sia SEMPRE un array nativo, non una stringa JSON
      badges: typeof userRaw.badges === 'string' 
        ? JSON.parse(userRaw.badges) 
        : (Array.isArray(userRaw.badges) ? userRaw.badges : [])
    }

    return {
      success: true,
      data: {
        user,
        stats: {
          reputationScore: 98.4,
          notarizedCodeCount: 18
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. GESTIONE PUT: Aggiornamento Bio, Avatar & Social
  // ----------------------------------------------------
  if (method === 'PUT') {
    const body = await readBody(event)
    const username = body.username || 'alexdpl'

    if (!body || typeof body !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Payload di aggiornamento non valido' })
    }

    // Inizializza l'utente nel record se inesistente
    if (!globalProfileStore[username]) {
      globalProfileStore[username] = { ...globalProfileStore['alexdpl'], username }
    }

    // Persistenza dei campi aggiornati
    globalProfileStore[username] = {
      ...globalProfileStore[username],
      avatar: body.avatar !== undefined ? body.avatar : globalProfileStore[username].avatar,
      bio: body.bio !== undefined ? body.bio : globalProfileStore[username].bio,
      github: body.github !== undefined ? body.github : globalProfileStore[username].github,
      twitter: body.twitter !== undefined ? body.twitter : globalProfileStore[username].twitter,
      linkedin: body.linkedin !== undefined ? body.linkedin : globalProfileStore[username].linkedin,
      reddit: body.reddit !== undefined ? body.reddit : globalProfileStore[username].reddit
    }

    return {
      success: true,
      message: 'Profilo aggiornato con successo nel Kernel DKP',
      data: {
        user: globalProfileStore[username]
      }
    }
  }

  // Blocco di sicurezza per metodi non supportati (es. POST, DELETE su /api/user/profile)
  throw createError({
    statusCode: 405,
    statusMessage: `Metodo HTTP ${method} non consentito su questa rotta.`
  })
})