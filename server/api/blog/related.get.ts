// server/api/blog/related.get.ts
import { and, desc, eq, ne, or, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts, blogCategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const currentId = Number(query.id)
  const category = typeof query.cat === 'string' ? query.cat.trim() : ''
  const tagsParam = typeof query.tags === 'string' ? query.tags : ''
  const requestedLimit = Number(query.limit) || 2
  const limit = Math.min(Math.max(requestedLimit, 1), 6)

  if (!Number.isInteger(currentId) || currentId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parametro id obbligatorio e numerico'
    })
  }

  const tags = tagsParam
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)

  const db = getDb()

  try {
    let categoryId: number | null = null

    if (category) {
      const cat = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.name, category),
        columns: { id: true }
      })

      categoryId = cat?.id ?? null
    }

    const baseConditions = [
      ne(blogPosts.id, currentId),
      eq(blogPosts.status, 'published')
    ]

    const relevanceConditions = []

    if (categoryId !== null) {
      relevanceConditions.push(eq(blogPosts.categoryId, categoryId))
    }

    if (tags.length > 0) {
      const tagArray = sql`ARRAY[${sql.join(
        tags.map(tag => sql`${tag}`),
        sql`, `
      )}]::text[]`

      relevanceConditions.push(
        sql`${blogPosts.tags}::jsonb ?| ${tagArray}`
      )
    }

    const whereClause = relevanceConditions.length > 0
      ? and(...baseConditions, or(...relevanceConditions))
      : and(...baseConditions)

    const orderExpressions = []

    if (categoryId !== null) {
      orderExpressions.push(
        desc(sql`CASE WHEN ${blogPosts.categoryId} = ${categoryId} THEN 1 ELSE 0 END`)
      )
    }

    orderExpressions.push(desc(blogPosts.createdAt))

    const related = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        category: blogCategories.name,
        date: blogPosts.createdAt
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(whereClause)
      .orderBy(...orderExpressions)
      .limit(limit)

    return related.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category || 'Senza categoria',
      date: post.date ? new Date(post.date).toISOString().split('T')[0] : null
    }))
  } catch (error: any) {
    console.error('[API /blog/related] Errore:', error)

    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Errore nel recupero dei post correlati'
    })
  }
})