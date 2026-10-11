// scripts/debug-drizzle.ts
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../drizzle/schema'
import * as relations from '../drizzle/relations'

async function runDiagnostic() {
  console.log("🔍 Avvio diagnostica Drizzle ORM...")

  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error("❌ ERRORE: DATABASE_URL mancante nel file .env!")
      process.exit(1)
    }

    console.log("1. Connessione a Neon DB...")
    const sql = neon(databaseUrl)

    console.log("2. Inizializzazione Drizzle con Schema e Relazioni...")
    const db = drizzle(sql, { schema: { ...schema, ...relations } })
    console.log("✅ Drizzle inizializzato con successo!")

    console.log("3. Esecuzione query di test su blogCategories...")
    const categories = await db.select().from(schema.blogCategories)
    console.log(`✅ Query completata! Trovate ${categories.length} categorie nel DB.`)

    if (categories.length > 0) {
      console.log("📋 Prima categoria:", categories[0]) // 🔥 Corretto qui!
    }

    process.exit(0)
  } catch (error: any) {
    console.error("\n❌ DIAGNOSTICA FALLITA - ECCO L'ERRORE REALE:")
    console.error(error)
    process.exit(1)
  }
}

runDiagnostic()