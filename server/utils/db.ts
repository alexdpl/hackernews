// server/utils/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema' // Import relativo garantito per Nuxt 4

// Manteniamo le istanze globali nel modulo per evitare la duplicazione dei socket ad ogni HMR
let sqlInstance: any = null
let dbInstance: any = null

export function getDb() {
  // 1. CACHE HIT: Se l'istanza esiste già, la restituiamo immediatamente azzerando i memory leak
  if (dbInstance) {
    console.log('=== [DB DEBUG] Restituisco istanza esistente dalla cache ===')
    return dbInstance
  }

  // Lettura sicura tramite le runtimeConfig tipizzate di Nuxt 4
  const config = useRuntimeConfig()
  const connectionString = config.databaseUrl

  // 2. TRACCIAMENTO VARIABILE: Verifica immediata della lettura del file .env o delle var di Vercel
  console.log('=== [DB DEBUG] Verifica runtimeConfig ===')
  if (!connectionString) {
    console.error('❌ ERRORE: La stringa di connessione è VUOTA o UNDEFINED!')
    throw new Error('NUXT_DATABASE_URL (mappata su databaseUrl) non è definita nella runtimeConfig')
  } else {
    console.log('✅ Stringa trovata! Inizia con:', connectionString.substring(0, 20) + '...')
  }

  try {
    // 3. INIZIALIZZAZIONE: Configurazione sicura del client Neon HTTP e passaggio dello schema a Drizzle
    console.log('=== [DB DEBUG] Inizializzazione client Neon e Drizzle ===')
    
    sqlInstance = neon(connectionString)
    // Passiamo esplicitamente l'oggetto di configurazione con lo schema importato
    dbInstance = drizzle(sqlInstance, { schema })
    
    console.log('✅ Client DB e istanza Drizzle ORM inizializzati con successo.')
    return dbInstance
  } catch (error: any) {
    console.error('❌ ERRORE durante l\'inizializzazione del DB:', error?.message || error)
    // Resettiamo le istanze a null in caso di fallimento per permettere un tentativo pulito al prossimo ciclo
    sqlInstance = null
    dbInstance = null
    throw error
  }
}