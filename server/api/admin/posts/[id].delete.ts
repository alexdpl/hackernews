import { posts } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Ricaviamo l'ID del post dall'URL (es: /api/admin/posts/5 -> id = 5)
  const idParam = getRouterParam(event, 'id')
  
  if (!idParam) {
    throw createError({ 
      statusCode: 400, 
      message: 'ID del post non specificato nella richiesta' 
    })
  }

  const postId = parseInt(idParam, 10)
  if (isNaN(postId)) {
    throw createError({ 
      statusCode: 400, 
      message: 'ID post non valido' 
    })
  }

  try {
    const database = getDb()

    // Cancelliamo il record corrispondente dall'ID nel database Neon
    const deletedPost = await database
      .delete(posts)
      .where(eq(posts.id, postId))
      .returning()

    console.log(`✅ [ADMIN] Post ID ${postId} eliminato dal DB`)

    return {
      success: true,
      message: `Post ${postId} eliminato con successo`,
      deleted: deletedPost
    }
  } catch (error: any) {
    console.error('❌ ERRORE CANCELLAZIONE POST ADMIN:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Errore durante la cancellazione del post dal database'
    })
  }
})