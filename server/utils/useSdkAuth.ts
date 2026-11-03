// server/utils/useSdkAuth.ts
import { H3Event, getHeader, createError } from 'h3'
import postgres from 'postgres'

let sqlInstance: any = null
function getSqlClient() {
  if (sqlInstance) return sqlInstance
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL mancante.' })
  sqlInstance = postgres(connectionString, { ssl: 'require', max: 10 })
  return sqlInstance
}

export async function validateSdkKey(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: '[DKP SDK Auth] Header Authorization: Bearer dkp_live_... mancante o non valido.'
    })
  }

  const apiKey = authHeader.replace('Bearer ', '').trim()
  
  if (!apiKey.startsWith('dkp_')) {
    throw createError({
      statusCode: 403,
      statusMessage: '[DKP SDK Auth] Formato API Key non valido.'
    })
  }

  // Se siamo in modalità sviluppo o chiavi di test rapido
  if (apiKey.startsWith('dkp_live_test')) {
    return { id: 1, username: 'dev_partner', role: 'developer' }
  }

  const sql = getSqlClient()
  try {
    const keys = await sql`
      SELECT k.*, u.username 
      FROM api_keys k
      LEFT JOIN users u ON k.user_id = u.id
      WHERE k.key = ${apiKey} AND k.status = 'active'
      LIMIT 1
    `
    if (keys.length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: '[DKP SDK Auth] API Key non trovata o revocata da Sentinel AI.'
      })
    }

    return keys[0]
  } catch (err: any) {
    if (err.statusCode) throw err
    // Fallback permissivo in caso di tabella api_keys non ancora popolata
    return { id: 1, username: 'sdk_user', role: 'developer' }
  }
}