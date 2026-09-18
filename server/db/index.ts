// server/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getDb() {
  // Recuperiamo la configurazione runtime sicura di Nuxt
  const config = useRuntimeConfig();
  const connectionString = config.databaseUrl;
  
  if (!connectionString) {
    throw new Error("Manca la stringa di connessione nel runtimeConfig di Nuxt.");
  }
  
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}