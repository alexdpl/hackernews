// server/api/blog/posts/[id].ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const idParam = event.context.params?.id
  const postId = Number(idParam)

  if (!postId || isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID articolo non valido' })
  }

  const db = getDb()

  // 🗑️ DELETE: ELIMINA ARTICOLO DAL DB NEON
  if (method === 'DELETE') {
    try {
      if (blogPosts && db.delete) {
        await db.delete(blogPosts).where(eq(blogPosts.id, postId))
      }
      return { success: true, message: `Articolo #${postId} eliminato con successo` }
    } catch (error: any) {
      console.error(`Errore eliminazione articolo #${postId}:`, error)
      throw createError({ statusCode: 500, statusMessage: `Impossibile eliminare l'articolo: ${error.message}` })
    }
  }

  // ✏️ PUT: AGGIORNA ARTICOLO SUL DB NEON
  if (method === 'PUT') {
    try {
      const body = await readBody(event)
      const updateData: Record<string, any> = {}

      if (body.title !== undefined) updateData.title = body.title
      if (body.slug !== undefined) updateData.slug = body.slug
      if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
      if (body.content !== undefined) updateData.content = body.content
      if (body.status !== undefined) updateData.status = body.status
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId ? Number(body.categoryId) : null
      if (body.subcategoryId !== undefined) updateData.subcategoryId = body.subcategoryId ? Number(body.subcategoryId) : null

      if (blogPosts && db.update) {
        await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, postId))
      }

      return { success: true, message: `Articolo #${postId} aggiornato con successo` }
    } catch (error: any) {
      console.error(`Errore aggiornamento articolo #${postId}:`, error)
      throw createError({ statusCode: 500, statusMessage: `Impossibile aggiornare l'articolo: ${error.message}` })
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non consentito' })
})