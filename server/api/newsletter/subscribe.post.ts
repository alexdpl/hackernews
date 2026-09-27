// server/api/newsletter/subscribe.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}
    const { email, name, source } = body

    if (!email || !email.includes('@')) {
      throw createError({ statusCode: 400, statusMessage: 'Indirizzo email non valido' })
    }

    const db = getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Errore di connessione al database' })
    }

    // Auto-Migration della tabella iscritti
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        source VARCHAR(50) DEFAULT 'WEB',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    // Inserisci o riattiva iscritto
    await db.execute(sql`
      INSERT INTO pulse_subscribers (email, name, source, status)
      VALUES (${email}, ${name || ''}, ${source || 'WEB'}, 'ACTIVE')
      ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE';
    `)

    return { success: true, message: 'Iscrizione alla Newsletter DKP completata con successo!' }
  } catch (error: any) {
    console.error('💥 [SUBSCRIBE ERROR]:', error)
    return { success: false, error: error.message }
  }
})