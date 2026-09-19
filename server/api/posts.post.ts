import { getDb } from '../utils/db'
import { sql } from 'drizzle-orm' // <--- Importante: aggiunto l'import di sql mancante

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1. Validazione del titolo
  if (!body.title || !body.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio.' })
  }

  const cleanTitle = body.title.trim()
  const cleanUrl = body.url && body.url.trim() ? body.url.trim() : null
  const rawText = body.text || body.content || ''
  const cleanText = rawText.trim() ? rawText.trim() : null

  // 2. Controllo mutua esclusione (Regola Hacker News)
  if (cleanUrl && cleanText) {
    throw createError({ statusCode: 400, statusMessage: 'Non puoi inserire sia un URL che un testo.' })
  }

  try {
    const db = await getDb()
    
    // Proviamo l'inserimento standard usando l'oggetto schema dinamico
    const targetTable = db.schema?.posts || sql`posts`
    await db.insert(targetTable).values({
      title: cleanTitle,
      url: cleanUrl,
      text: cleanText,
      createdAt: new Date()
    })

    return { success: true }
  } catch (error: any) {
    console.error('Errore inserimento standard post, eseguo fallback:', error)
    
    try {
      const db = await getDb()
      // Fallback sicuro se 'createdAt' genera conflitti di mappatura colonne
      const queryAlternative = sql`INSERT INTO posts (title, url, text) VALUES (${cleanTitle}, ${cleanUrl}, ${cleanText})`
      await db.execute(queryAlternative)
      return { success: true }
    } catch (innerError) {
      console.error('Errore definitivo anche nel fallback:', innerError)
      throw createError({ statusCode: 500, statusMessage: 'Errore durante il salvataggio su Neon DB.' })
    }
  }
})