// server/api/admin/posts.ts
import { eq, desc } from 'drizzle-orm'
import { posts } from '../../db/schema'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  // Configurazione di sicurezza rapida
  const ADMIN_SECRET = 'il_tuo_secret_di_admin_qui'
  const authHeader = getHeader(event, 'x-admin-secret')

  if (authHeader !== ADMIN_SECRET) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorizzato. Secret amministratore non valido.',
    })
  }

  const method = getMethod(event)

  // 1. GET: Recupera tutti i post per la dashboard
  if (method === 'GET') {
    try {
      const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt))
      return allPosts
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: `Errore nel recupero dei post: ${error.message}`,
      })
    }
  }

  // 2. DELETE: Elimina un post specifico (commenti e voti cadono in CASCADE)
  if (method === 'DELETE') {
    const body = await readBody(event)
    const { id } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID del post mancante.',
      })
    }

    try {
      await db.delete(posts).where(eq(posts.posts.id, Number(id)))
      return { success: true, message: `Post #${id} eliminato con successo.` }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: `Errore durante l'eliminazione: ${error.message}`,
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Metodo non supportato',
  })
})