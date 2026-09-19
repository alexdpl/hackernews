import { jobs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  // Accettiamo solo richieste POST per la creazione
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')

  // Controllo di sicurezza con la password amministrativa
  if (!config.adminSecret || authHeader !== `Bearer ${config.adminSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const body = await readBody(event)
    
    // Validazione minima dei campi obbligatori
    if (!body.title || !body.company) {
      throw createError({ statusCode: 400, statusMessage: 'Title and Company are required fields' })
    }

    const database = getDb()

    // Inserimento del nuovo lavoro nel database Neon
    const [newJob] = await database.insert(jobs).values({
      title: body.title,
      company: body.company,
      url: body.url || null,
      text: body.text || null,
      location: body.location || 'Remote',
    }).returning()

    return {
      success: true,
      job: newJob
    }
  } catch (error: any) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: error.message || 'Errore durante il salvataggio del Job' 
    })
  }
})