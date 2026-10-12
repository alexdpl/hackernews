// server/api/submit.post.ts
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/drizzle/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || !body.title) {
    throw createError({ statusCode: 400, message: 'Il titolo è obbligatorio.' })
  }

  try {
    const db = await getDb()

    // 1. Generazione Slug (pulito e univoco)
    let baseSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    let uniqueSlug = baseSlug
    let counter = 1

    // Controllo collisione slug (SQL Puro)
    let existingPost = await db.select().from(blogPosts).where(eq(blogPosts.slug, uniqueSlug)).limit(1)
    while (existingPost.length > 0) {
      uniqueSlug = `${baseSlug}-${counter}`
      existingPost = await db.select().from(blogPosts).where(eq(blogPosts.slug, uniqueSlug)).limit(1)
      counter++
    }

    // 2. Formattazione e Validazione Dati
    const nowIso = new Date().toISOString()
    
    // Assegna la categoria o il type in base a quello che seleziona l'utente
    // Se usi "category" come campo per distinguere (es. 'news', 'ask', 'show'), mappalo qui:
    const postType = body.type || 'news'

    // Formattazione URL (assicuriamoci che inizi con http se c'è)
    let validUrl = body.url ? body.url.trim() : null
    if (validUrl && !validUrl.startsWith('http')) {
      validUrl = 'https://' + validUrl
    }

    // 3. Inserimento nel Database (SQL Puro)
    const [newPost] = await db.insert(blogPosts).values({
      title: body.title,
      slug: uniqueSlug,
      content: body.content || null,
      excerpt: body.content ? body.content.substring(0, 150) + '...' : null,
      // Se hai un campo per il link esterno nel tuo schema (es. "url" o "externalLink"), usa quello. 
      // Se non ce l'hai, possiamo salvare l'URL dentro il "content".
      // Supponiamo che tu abbia un campo "category" o usi "categoryId"
      category: postType, 
      status: 'published', // O 'draft' se vuoi che passino dalla moderazione
      createdAt: nowIso,
      updatedAt: nowIso,
      isVerified: false, 
      likes: 0,
      views: 0
    }).returning()

    return {
      success: true,
      message: `Contenuto pubblicato nella sezione ${postType.toUpperCase()}!`,
      data: newPost
    }

  } catch (error: any) {
    console.error('[API SUBMIT ERROR]:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Errore interno durante il salvataggio nel DB.' 
    })
  }
})