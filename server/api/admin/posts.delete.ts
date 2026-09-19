// server/api/admin/posts.delete.ts
import { posts } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')

  if (!config.adminSecret || authHeader !== `Bearer ${config.adminSecret}`) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Unauthorized: Invalid Admin Secret' 
    })
  }

  const body = await readBody(event)
  const { postId } = body

  if (!postId) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Bad Request: Missing postId' 
    })
  }

  try {
    // Inizializzazione sicura on-demand
    const database = getDb()

    const deletedRows = await database.delete(posts)
      .where(eq(posts.id, Number(postId)))
      .returning({ deletedId: posts.id })

    if (deletedRows.length === 0) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: 'Post not found' 
      })
    }

    return {
      success: true,
      message: `Post ${postId} eliminato con successo.`,
      deletedId: deletedRows.deletedId
    }
  } catch (error: any) {
    console.error('Database Error durante la cancellazione:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: error.message || 'Database execution failed' 
    })
  }
})