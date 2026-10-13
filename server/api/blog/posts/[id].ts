// server/api/blog/posts/[id].ts
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID Articolo mancante nell\'URL' })
  }
  
  // 🟢 FIX INTELLIGENTE: Se il DB usa UUID (stringhe) o Numeri seriali, li gestiamo entrambi senza dare "NaN"
  const articleId = isNaN(Number(idParam)) ? idParam : Number(idParam)
  const method = event.node.req.method
  
  const db = getDb()

  try {
    // ==========================================
    // 🟢 METODO PUT (AGGIORNAMENTO ARTICOLO)
    // ==========================================
    if (method === 'PUT') {
      const body = await readBody(event)

      const updateData: any = {
        title: body.title,
        categoryName: body.category,
        subCategory: body.subCategory,
        excerpt: body.excerpt || body.summary,
        content: body.content,
        tags: body.tags || [],
        status: body.status || 'draft',
        updatedAt: new Date()
      }

      // Aggiorniamo lo slug se il titolo cambia
      if (body.title) {
        updateData.slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      }

      const updatedPost = await db.update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, articleId as any))
        .returning()

      if (!updatedPost.length) {
        throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato nel DB Neon' })
      }

      return { success: true, message: 'Articolo aggiornato con successo', data: updatedPost[0] }
    }

    // ==========================================
    // 🔴 METODO DELETE (ELIMINAZIONE ARTICOLO)
    // ==========================================
    if (method === 'DELETE') {
      const deletedPost = await db.delete(blogPosts)
        .where(eq(blogPosts.id, articleId as any))
        .returning()

      if (!deletedPost.length) {
        throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato o già eliminato' })
      }

      return { success: true, message: 'Articolo eliminato definitivamente dal Vault' }
    }

    throw createError({ statusCode: 405, statusMessage: 'Metodo non consentito su questo endpoint' })

  } catch (error: any) {
    console.error(`Errore API [id].ts (${method}):`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Errore interno del server'
    })
  }
})