// scripts/debug-chat.ts
import dotenv from 'dotenv'
dotenv.config()

import { getDb } from '../server/utils/db.ts'
import { pulseChatMessages, users } from '../server/db/schema.ts'
import { sql } from 'drizzle-orm'

async function runDiagnostic() {
  console.log("🔍 [DEBUG] Allineamento totale colonne schema Drizzle vs Neon...")
  try {
    const db = getDb()
    console.log("🟢 Connessione al DB OK!")

    // 1. Assicuriamoci che la tabella esista
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_chat_messages (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    // 2. Aggiungiamo tutte le colonne che Drizzle si aspetta se mancano
    await db.execute(sql`
      ALTER TABLE pulse_chat_messages ADD COLUMN IF NOT EXISTS user_id INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE pulse_chat_messages ADD COLUMN IF NOT EXISTS message TEXT;
    `)
    // Se per caso c'era la vecchia colonna 'text' e Drizzle usa 'message', copiamo i dati o la lasciamo convivere
    await db.execute(sql`
      UPDATE pulse_chat_messages SET message = text WHERE message IS NULL AND text IS NOT NULL;
    `).catch(() => {})

    console.log("🟢 Tutte le colonne ('user_id', 'message') sono state allineate con successo!")

    // 3. Testiamo finalmente la lettura con Drizzle
    const messages = await db.select().from(pulseChatMessages).limit(5)
    console.log(`🟢 Lette ${messages.length} righe dalla tabella chat con Drizzle senza un singolo errore!`)

    console.log("✨ SUCCESSO TOTALE: Il database è perfettamente sincronizzato con la v2.5-GOLD!")
  } catch (error: any) {
    console.error("❌ ERRORE INTERCETTATO:")
    console.error(error)
  }
}

runDiagnostic()