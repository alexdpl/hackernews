import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema' // Import relativo per garantire la risoluzione in Nuxt 4

let sqlInstance: any = null
let dbInstance: any = null

export function getDb() {
  if (dbInstance) {
    console.log('=== [DB DEBUG] Restituisco istanza esistente dalla cache ===')
    return dbInstance
  }

  const config = useRuntimeConfig()
  const connectionString = config.databaseUrl

  // 1. TRACCIAMENTO VARIABILE: Vediamo subito se Nuxt legge il file .env locale
  console.log('=== [DB DEBUG] Verifica runtimeConfig ===')
  if (!connectionString) {
    console.error('❌ ERRORE: La stringa di connessione è VUOTA o UNDEFINED!')
    throw new Error('NUXT_DATABASE_URL is not defined in runtimeConfig')
  } else {
    console.log('✅ Stringa trovata! Inizia con:', connectionString.substring(0, 20) + '...')
  }

  try {
    // 2. INIZIALIZZAZIONE: Proviamo a connetterci a Neon
    console.log('=== [DB DEBUG] Inizializzazione client Neon e Drizzle ===')
    sqlInstance = neon(connectionString)
    dbInstance = drizzle(sqlInstance, { schema })
    
    console.log('✅ Client DB inizializzato con successo.')
    return dbInstance
  } catch (error: any) {
    console.error('❌ ERRORE durante l\'inizializzazione del DB:', error.message)
    throw error
  }
}