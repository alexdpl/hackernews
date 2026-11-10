// server/utils/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

let sqlInstance: any = null
let dbInstance: any = null

/**
 * Estrae la stringa di connessione NeonDB in modo sicuro per Nitro e Cloud Run
 */
function getConnectionString(): string {
  let config: any = {}
  try {
    config = useRuntimeConfig()
  } catch (_) {}

  const connectionString = (
    config?.databaseUrl ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL
  ) as string

  if (!connectionString) {
    console.error('❌ ERRORE CRITICO: Connection String mancante nelle variabili d\'ambiente!')
    throw new Error('NUXT_DATABASE_URL o DATABASE_URL non definita su Cloud Run.')
  }

  return connectionString.trim()
}

/**
 * Inizializza ed ottiene la connessione Pure SQL nativa di Neon (HTTP)
 */
export function getSql() {
  if (!sqlInstance) {
    const url = getConnectionString()
    sqlInstance = neon(url)
  }
  return sqlInstance
}

/**
 * Inizializza ed ottiene l'istanza Drizzle (Pure SQL Mode / Schemaless)
 */
export function getDb() {
  if (!dbInstance) {
    const client = getSql()
    // Inizializzazione Drizzle SENZA schema per eliminare qualsiasi dipendenza relazionale
    dbInstance = drizzle(client)
    console.log('✅ DB Client e Drizzle inizializzati (Pure SQL Container Mode)')
  }
  return dbInstance
}

/**
 * Tagged Template Function trasparente per query Pure SQL:
 * Permette la sintassi: await sql`SELECT * FROM ...`
 */
export const sql: ReturnType<typeof neon> = ((...args: any[]) => {
  const client = getSql()
  return (client as any)(...args)
}) as any

/**
 * Proxy trasparente per Drizzle / Pure SQL:
 * Permette sia l'uso di db.insert(...) che dell'invocazione diretta db`INSERT INTO ...`
 */
export const db: any = new Proxy(function () {}, {
  get(_, prop) {
    const instance = getDb()
    const value = instance[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  },
  apply(_, __, args) {
    const client = getSql()
    return (client as any)(...args)
  }
})

export default db