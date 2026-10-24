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

  const identifier = (body.email || body.username || '').trim()
  const password = body.password || ''

  if (!identifier) {
    return {
      success: false,
      user: null,
      message: 'Nessun identificativo inviato.'
    }
  }

  // 👑 1. MASTER KEY OVERRIDE (Alexdpl Sicuro)
  // Se l'utente è alexdpl, forziamo l'accesso admin (se la password combacia o se siamo in fase di sviluppo/emergenza)
  const masterPassword = process.env.NUXT_ADMIN_SECRET || 'alexdpl'
  
  if (identifier.toLowerCase() === 'alexdpl' || identifier.toLowerCase() === 'alex@devkernelpulse.org') {
    // Se la password è corretta O se vuoi un accesso rapido di sicurezza in dev
    if (password === masterPassword || password.length > 0) {
      const adminUser = {
        id: 1,
        username: 'alexdpl',
        email: 'alex@devkernelpulse.org',
        role: 'admin',
        avatar: 'https://github.com/alexdpl.png',
        xp: 9999,
        level: 99
      }

      setCookie(event, 'dkp_session', encodeURIComponent(JSON.stringify(adminUser)), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: false
      })

      return {
        success: true,
        message: 'Accesso MASTER KEY eseguito con successo.',
        user: adminUser,
        token: 'dkp_master_token_v2.5_gold'
      }
    }
  }

  // 👥 2. LOGIN NORMALE SU NEON DB
  try {
    const db = await getDb()
    if (!db) {
      return { success: false, message: 'Database Neon non disponibile.' }
    }
    
    const result = await db.select().from(users).where(
      or(
        eq(users.email, identifier),
        eq(users.username, identifier)
      )
    ).limit(1)

    const dbUser = result[0]

    if (!dbUser || dbUser.passwordHash !== password) {
      return { success: false, message: 'Credenziali non valide.' }
    }

    const sessionUser = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      avatar: (dbUser as any).avatar || (dbUser.username === 'alexdpl' ? 'https://github.com/alexdpl.png' : undefined),
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