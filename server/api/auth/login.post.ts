// server/api/auth/login.post.ts
import { defineEventHandler, readBody, setCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username) {
    return { success: false, error: 'Username richiesto' }
  }

  const db = getDb()

  try {
    // Verifica se la tabella users esiste e ha la colonna password
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) DEFAULT 'admin123',
        bio TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Cerca l'utente
    const res: any = await db.execute(sql`
      SELECT username, password FROM users WHERE username = ${username}
    `)
    let user = res[0] || res?.rows?.[0]

    // Se l'utente non esiste e si tratta di alexdpl, lo creiamo al volo
    if (!user && username === 'alexdpl') {
      await db.execute(sql`
        INSERT INTO users (username, password, bio) 
        VALUES ('alexdpl', ${password || 'admin123'}, 'Amministratore e Creatore di DevKernelPulse')
        ON CONFLICT (username) DO NOTHING
      `)
      user = { username: 'alexdpl', password: password || 'admin123' }
    }

    if (!user) {
      return { success: false, error: 'Utente non trovato' }
    }

    // Imposta un cookie di sessione semplice
    setCookie(event, 'dkp_user', username, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 settimana
    })

    return { success: true, username }
  } catch (err: any) {
    console.error('Errore login:', err)
    return { success: false, error: err.message }
  }
})