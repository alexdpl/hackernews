// server/utils/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// ❌ NIENTE IMPORT DI SCHEMA O RELATIONS QUI!
// Tagliamo il cordone: Drizzle non saprà nulla delle relazioni globali.

let sqlInstance: any = null
let dbInstance: any = null

export function getDb() {
  if (dbInstance) {
    return dbInstance
  }

  let config: any = {}
  try {
    config = useRuntimeConfig()
  } catch (_) {}

  const connectionString = (config?.databaseUrl || process.env.DATABASE_URL) as string

  if (!connectionString) {
    console.error('❌ ERRORE: La stringa di connessione è VUOTA!')
    throw new Error('NUXT_DATABASE_URL o DATABASE_URL non definita.')
  }

  try {
    sqlInstance = neon(connectionString)
    
    // 🔥 IL TAGLIO DEL CORDONE OMBELICALE 🔥
    // Inizializziamo Drizzle SENZA passargli { schema } o { relations }.
    // Diventa un puro costruttore di query SQL. 
    // È fisicamente impossibile che generi l'errore "referencedTable" perché non mappa più le relazioni al boot!
    dbInstance = drizzle(sqlInstance)

    console.log('✅ Client DB e Drizzle inizializzati (Pure SQL Mode).')
    return dbInstance
  } catch (error: any) {
    console.error('❌ ERRORE Inizializzazione DB:', error)
    sqlInstance = null
    dbInstance = null
    throw error
  }
}