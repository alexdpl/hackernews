// server/api/posts.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '../utils/db'
import { posts } from '../db/schema' // Assicurati che l'import del modello punti al tuo schema esplicito

interface PostPayload {
  title: string
  url?: string
  text?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<PostPayload>(event)
    const { title, url, text } = body

    // 1. Validazione di sicurezza lato Server
    if (!title || title.trim().length < 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il titolo è obbligatorio e deve contenere almeno 3 caratteri.',
      })
    }

    // Almeno uno dei due campi opzionali deve esistere (Logica flessibile HN sbloccata)
    if (!url && !text) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Inserisci un URL esterno, un testo per la discussione o entrambi.',
      })
    }

    const cleanTitle = title.trim()
    const cleanUrl = url && url.trim() !== '' ? url.trim() : null
    const cleanText = text && text.trim() !== '' ? text.trim() : null

    // 2. Ottenimento dell'istanza DB isolata dalla cache
    const db = getDb()

    /* 
      3. INSERIMENTO CORRETTO CON DRIZZLE QUERY BUILDER:
      Bypassa gli errori di parsing delle proprietà SQL raw. Se usi i metodi nativi di Drizzle,
      i campi createdAt/updatedAt e i relativi vincoli vengono autogestiti o mappati.
    */
    const [newPost] = await db
      .insert(posts)
      .values({
        title: cleanTitle,
        url: cleanUrl,
        text: cleanText,
        points: 1,
        // Se nel tuo schema i campi temporali usano defaultNow(), puoi omettere queste righe
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning() // Sfrutta il RETURNING nativo di Postgres per estrarre subito il record creato

    // 4. Risposta di successo inviata al client
    return {
      success: true,
      message: 'Post salvato con successo su Neon DB.',
      data: newPost,
    }

  } catch (error: any) {
    console.error('=== [CRITICAL] FALLIMENTO INSERIMENTO POSTS ===')
    console.error('Dettaglio Errore:', error)

    // Gestione degli errori di violazione dei vincoli del Database (es. url duplicato o campi mancanti)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Errore durante il salvataggio su Neon DB. Verificare i vincoli dello schema.',
    })
  }
})