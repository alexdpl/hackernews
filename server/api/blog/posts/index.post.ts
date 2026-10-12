// server/api/blog/posts/index.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogPosts, users } from '~~/drizzle/schema'
import crypto from 'node:crypto'

function slugify(text: string): string {
  return text.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {}
  
  // 🔥 VAULT INTEGRATION: Accettiamo sastStatus, vaultHash e status scelto dall'utente
  const { title, categoryId, subcategoryId, excerpt, content, tags, vaultHash: reqVaultHash, sastStatus, status } = body

  const cleanTitle = title?.trim()
  if (!cleanTitle || !categoryId) {
    throw createError({ statusCode: 400, statusMessage: 'Titolo e Categoria sono obbligatori.' })
  }

  const generatedSlug = slugify(cleanTitle)
  const numericCategoryId = Number(categoryId)
  const numericSubcategoryId = subcategoryId ? Number(subcategoryId) : null
  
  let cleanTags: string[] = []
  if (Array.isArray(tags)) cleanTags = tags
  else if (typeof tags === 'string') cleanTags = tags.split(',').map(t => t.trim()).filter(Boolean)

  try {
    const db = getDb()

    let authorId = 1
    const [existingAdmin] = await db.select().from(users).limit(1)
    if (existingAdmin) authorId = existingAdmin.id

    // 🔥 FIX VAULT LOGIC: Applichiamo il vero hash generato dall'analisi
    const finalVaultHash = reqVaultHash || crypto.createHash('sha256').update(`dkp-direct-${Date.now()}-${generatedSlug}`).digest('hex')
    const vaultCertificateId = reqVaultHash ? `DKP-VAULT-CERT-VERIFIED-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : `DKP-VAULT-CERT-ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    // 🛡️ FIX v2.5-GOLD: Rispettiamo lo status scelto dall'utente (es. 'published' se preme Pubblica).
    // Salviamo l'esito del Vault (isVerified) solo come badge visivo, senza forzare in bozza.
    const finalStatus = status || 'draft' 
    const isVerified = sastStatus !== 'CRITICAL' && reqVaultHash != null

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
        tags: cleanTags,
        status: finalStatus,
        isVerified,
        vaultCertificateId,
        vaultHash: finalVaultHash,
        views: 0,
        likes: 0,
      })
      .returning()

    return {
      success: true,
      message: finalStatus === 'draft' ? 'Bozza salvata con successo.' : 'Articolo pubblicato e notarizzato con successo nel DB Neon!',
      data: newPost,
    }
  } catch (error: any) {
    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      throw createError({ statusCode: 409, statusMessage: 'Un articolo con questo titolo o slug esiste già.' })
    }
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || `Errore DB: ${error.message}` })
  }
})