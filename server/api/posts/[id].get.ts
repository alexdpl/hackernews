// server/api/posts/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, or } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db' // 👈 'getDb' con la 'B' maiuscola
import { blogPosts, blogCategories } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const idOrSlug = getRouterParam(event, 'id')

  if (!idOrSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Parametro ID/Slug mancante' })
  }

  const db = getDb()
  const numId = Number(idOrSlug)
  const isNumeric = !isNaN(numId)

  try {
    const result = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
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
      .where(
        isNumeric
          ? or(eq(blogPosts.id, numId), eq(blogPosts.slug, idOrSlug))
          : eq(blogPosts.slug, idOrSlug)
      )
      .limit(1)

    const post = result[0]

    if (!post) {
      throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato' })
    }

    return post
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore recupero articolo: ${error.message}`
    })
  }
})