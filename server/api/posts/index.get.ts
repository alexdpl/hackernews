// server/api/posts/index.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getdb } from '~~/server/utils/db'
import { blogPosts, blogCategories } from '~~/server/db/schema'

export default defineEventHandler(async () => {
  try {
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        status: blogPosts.status,
        views: blogPosts.views,
        likes: blogPosts.likes,
        createdAt: blogPosts.createdAt,
        categoryId: blogPosts.categoryId,
        category: blogCategories.name
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .orderBy(desc(blogPosts.createdAt))

    return posts
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Errore caricamento lista articoli: ${error.message}`
    })
  }
})