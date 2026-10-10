// server/api/blog/posts/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
// 🔥 FIX: Import degli schemi per le relazioni
import { blogPosts, blogCategories, users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug mancante' })

  const db = await getDb()
  let post = null;

  // Tentativo con Drizzle Relational Queries (raccomandato)
  if (db.query && db.query.blogPosts) {
     post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
        with: {
           category: true,
           author: {
             columns: { username: true, avatarUrl: true }
           }
        }
     })
  } else {
     // Fallback classico se db.query fallisce
     const result = await db
       .select({
         post: blogPosts,
         category: blogCategories,
         author: users
       })
       .from(blogPosts)
       .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
       .leftJoin(users, eq(blogPosts.authorId, users.id))
       .where(eq(blogPosts.slug, slug))
       .limit(1)

     if (result.length > 0) {
        post = {
          ...result[0].post,
          category: result[0].category,
          author: result[0].author ? { username: result[0].author.username, avatarUrl: result[0].author.avatarUrl } : null
        }
     }
  }

  if (!post) throw createError({ statusCode: 404, message: 'Articolo non trovato' })

  // Normalizziamo anche qui per coerenza
  const normalizedPost = {
    ...post,
    categoryName: post.category?.name || 'Generale',
    authorName: post.author?.username || 'Alessandro De Paola',
    tags: Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : [])
  }

  return { success: true, data: normalizedPost }
})