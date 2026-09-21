import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getDb } from '../../../utils/db'
import { posts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  
  if (!idParam) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'ID del post non specificato nella richiesta' 
    })
  }

  const postId = parseInt(idParam, 10)
  if (isNaN(postId)) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'ID post non valido' 
    })
  }

  try {
    const database = getDb()

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
      statusMessage: error.message || 'Errore durante la cancellazione del post dal database'
    })
  }
})