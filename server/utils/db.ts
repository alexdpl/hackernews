// server/utils/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { posts, comments } from '~~/server/db/schema'
import { eq, asc } from 'drizzle-orm'
// Usiamo l'alias '~~/' per partire dalla cartella principale del progetto
import * as schema from  '~~/server/db/schema' // Punta alla cartella db nella radice

export const getDb = () => {
  const config = useRuntimeConfig()
  
  const connectionString = 
    config.databaseUrl || 
    process.env.NUXT_DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("Errore critico: Nessuna stringa di connessione trovata per Neon DB.")
  }
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export const db = getDb()