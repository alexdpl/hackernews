// server/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getDb() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("Manca la variabile d'ambiente DATABASE_URL o POSTGRES_URL");
  }
  
  // Utilizziamo direttamente l'importazione standard nativa ES Module
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
  }