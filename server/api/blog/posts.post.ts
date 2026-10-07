// server/api/admin/blog/posts.post.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogPosts, users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'

// Parser nativo del body
async function getRequestBody(event: any): Promise<any> {
  const req = event.node?.req || event.req
  if (req?.body && typeof req.body === 'object') return req.body

  return new Promise((resolve) => {
    if (!req) return resolve({})
    let rawData = ''
    req.on('data', (chunk: any) => { rawData += chunk })
    req.on('end', () => {
      try { resolve(rawData ? JSON.parse(rawData) : {}) } 
      catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W_]+-/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const body = (await getRequestBody(event)) || {}
  const { title, categoryId, subcategoryId, excerpt, content, authorName } = body

  const cleanTitle = title?.trim()
  if (!cleanTitle || !categoryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Titolo e Categoria sono obbligatori.',
    })
  }

  const generatedSlug = slugify(cleanTitle)
  const numericCategoryId = Number(categoryId)
  const numericSubcategoryId = subcategoryId ? Number(subcategoryId) : null

  try {
    const db = getDb()

    // 1. Recupero o Fallback Utente Admin (authorId)
    let authorId = 1
    const [existingAdmin] = await db.select().from(users).limit(1)
    if (existingAdmin) {
      authorId = existingAdmin.id
    }

    // 2. Generazione Certificato e Hash Crittografico DKP Vault
    const vaultHash = crypto.createHash('sha256').update(`dkp-direct-${Date.now()}-${generatedSlug}`).digest('hex')
    const vaultCertificateId = `DKP-VAULT-CERT-ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`

    // 3. Inserimento in Neon DB
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        title: cleanTitle,
        slug: generatedSlug,
        content: content || excerpt || 'Nessun contenuto esteso fornito.',
        excerpt: excerpt ? excerpt.trim() : null,
        categoryId: numericCategoryId,
        subcategoryId: numericSubcategoryId,
        authorId,
        status: 'published',
        isVerified: true,
        vaultCertificateId,
        vaultHash,
        views: 0,
        likes: 0,
      })
      .returning()

    return {
      success: true,
      message: 'Articolo pubblicato con successo e salvato sul DB Neon!',
      data: newPost,
    }
  } catch (error: any) {
    console.error('Errore pubblicazione articolo admin:', error)

    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Un articolo con questo titolo o slug esiste già.',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore DB: ${error.message}`,
    })
  }
})