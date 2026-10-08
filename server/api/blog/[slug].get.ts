// server/api/blog/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug mancante' })

  const db = await getDb()
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1)

  if (!post) throw createError({ statusCode: 404, message: 'Articolo non trovato' })

  return { success: true, data: post }
})