// server/api/blog/posts/[id]/view.post.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    return { success: false, message: 'ID non valido' }
  }

  try {
    const db = await getDb()

    // Incrementa in modo atomico il campo views
    await db
      .update(blogPosts)
      .set({
        views: sql`${blogPosts.views} + 1`
      })
      .where(eq(blogPosts.id, Number(id)))

    return { success: true }
  } catch (error: any) {
    console.error(`Errore incremento view per post ${id}:`, error.message)
    return { success: false, error: error.message }
  }
})