// server/api/auth/login.post.ts
import { defineEventHandler, readBody, setCookie } from 'h3'
import { eq, or } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  let body: Record<string, any> = {}

  try {
    const parsedBody = await readBody(event)
    if (parsedBody && typeof parsedBody === 'object') {
      body = parsedBody
    }
  } catch (_) {}

  // L'interfaccia UI usa "Username o Email", quindi catturiamo entrambi i casi
  const identifier = body.email || body.username || ''
  const password = body.password || ''

  // Controllo sessione a vuoto (non logga errori rossi in console)
  if (!identifier || !password) {
    return {
      success: false,
      user: null,
      message: 'Nessuna credenziale inviata.'
    }
  }

  // 👑 1. MASTER KEY OVERRIDE (Agganciato al tuo NUXT_ADMIN_SECRET)
  // Se l'utente digita "alexdpl" e la password complessa del .env, entra ALL'ISTANTE.
  const masterPassword = process.env.NUXT_ADMIN_SECRET
  
  if ((identifier.toLowerCase() === 'alexdpl' || identifier.toLowerCase() === 'alex@devkernelpulse.org') && password === masterPassword) {
    const adminUser = {
      id: 1,
      username: 'alexdpl',
      email: 'alex@devkernelpulse.org',
      role: 'admin',
      avatar: 'https://github.com/alexdpl.png', // 🖼️ RIPRISTINATA IMMAGINE ADMIN!
      xp: 9999,
      level: 99
    }

    // Settiamo il cookie lato server
    setCookie(event, 'dkp_session', encodeURIComponent(JSON.stringify(adminUser)), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 settimana
      httpOnly: false // false così useAuthCore può leggerlo dal client
    })

    return {
      success: true,
      message: 'Accesso MASTER KEY eseguito con successo.',
      user: adminUser,
      token: 'dkp_master_token_v2.5_gold'
    }
  }

  // 👥 2. LOGIN NORMALE SU NEON DB (Per tutti gli altri utenti)
  try {
    const db = await getDb()
    if (!db) {
      return { success: false, message: 'Database Neon non disponibile.' }
    }
    
    // Cerca l'utente per email O username
    const result = await db.select().from(users).where(
      or(
        eq(users.email, identifier),
        eq(users.username, identifier)
      )
    ).limit(1)

    const dbUser = result[0]

    // Check della password
    if (!dbUser || dbUser.passwordHash !== password) {
      return { success: false, message: 'Credenziali non valide.' }
    }

    const sessionUser = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      avatar: (dbUser as any).avatar || (dbUser.username === 'alexdpl' ? 'https://github.com/alexdpl.png' : undefined), // 🖼️ AVATAR DA DB O FALLBACK
      xp: dbUser.xp || 150,
      level: dbUser.level || 1
    }

    setCookie(event, 'dkp_session', encodeURIComponent(JSON.stringify(sessionUser)), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false
    })

    return {
      success: true,
      message: 'Accesso eseguito con successo.',
      user: sessionUser,
      token: 'dkp_db_token_v2.5'
    }

  } catch (error) {
    console.error('Errore Login DB:', error)
    return { success: false, message: 'Errore di connessione al database.' }
  }
})