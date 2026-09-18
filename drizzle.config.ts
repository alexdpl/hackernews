// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

if (!process.env.NUXT_DATABASE_URL) {
  throw new Error('La variabile d\'ambiente NUXT_DATABASE_URL non è impostata nel file .env!')
}

export default defineConfig({
  // Diciamo chiaramente a Drizzle dove trovare il file schema corretto
  schema: './server/db/schema.ts',
  
  // Cartella di output per eventuali file di migrazione storici
  out: './drizzle',
  
  // Dialetto del database in uso
  dialect: 'postgresql',
  
  // Credenziali ereditate dalla variabile d'ambiente
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL,
  },
})