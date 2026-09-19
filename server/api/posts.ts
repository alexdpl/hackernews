import { posts } from '../db/schema'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  // Estraiamo i parametri inviati dal frontend con valori di fallback sicuri
  const query = getQuery(event)
  const feed = (query.feed as string) || 'news'
  const page = Math.max(1, parseInt(query.page as string) || 1)
  
  const limit = 30
  const offset = (page - 1) * limit

 // ... resto del codice identico sopra ...
  try {
    const database = getDb()

    const result = await database
      .select()
      .from(posts)
      .where(eq(posts.type, feed))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)

    return result
  } catch (error: any) {
    // DIAGNOSTICA SQL: Vediamo l'errore esatto del database su PowerShell
    console.error('❌ ERRORE SQL DETTAGLIATO:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    
    throw createError({ 
      statusCode: 500, 
      message: error.message || 'Errore durante il recupero dei post dal database Neon' 
    })
  }
})