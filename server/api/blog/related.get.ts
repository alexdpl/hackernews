// server/api/blog/related.get.ts
import { eq, and, ne, desc, sql, or } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts, blogCategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const currentId = Number(query.id)
  const category = (query.cat as string)?.trim() || ''
  const tagsParam = (query.tags as string) || ''
  const limit = Math.min(Number(query.limit) || 2, 6)

  if (!currentId || isNaN(currentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parametro id obbligatorio e numerico'
    })
  }

  const db = getDb()

  // Normalizziamo i tag ricevuti
  const tags = tagsParam
    ? tagsParam.split(',').map(t => t.trim()).filter(Boolean)
    : []

  try {
    // 1. Recuperiamo l'ID della categoria (se passata)
    let categoryId: number | null = null
    if (category) {
      const cat = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.name, category),
        columns: { id: true }
      })
      categoryId = cat?.id ?? null
    }

    // 2. Costruiamo le condizioni di correlazione
    const baseConditions = [
      ne(blogPosts.id, currentId),
      eq(blogPosts.status, 'published')
    ]

    // Condizione di rilevanza: stessa categoria OPPURE almeno un tag in comune
    const relevanceConditions = []

    if (categoryId) {
      relevanceConditions.push(eq(blogPosts.categoryId, categoryId))
    }

    if (tags.length > 0) {
      // Funziona sia se tags è text[] che jsonb (grazie al cast)
      relevanceConditions.push(
        sql`${blogPosts.tags}::jsonb ?| array[${sql.join(tags.map(t => sql`${t}`))}]`
      )
      // Alternativa se usi text[] puro:
      // sql`${blogPosts.tags} && ARRAY[${sql.join(tags.map(t => sql`${t}`))}]::text[]`
    }

    // Se non abbiamo né categoria né tag, restituiamo i più recenti
    const whereClause = relevanceConditions.length > 0
      ? and(...baseConditions, or(...relevanceConditions))
      : and(...baseConditions)

    // 3. Query principale
    const related = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        category: blogCategories.name,
        date: blogPosts.publishedAt,
        tags: blogPosts.tags,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(whereClause)
      .orderBy(
        // 1. Priorità massima alla stessa categoria
        desc(sql`CASE WHEN ${blogPosts.categoryId} = ${categoryId} THEN 1 ELSE 0 END`),
        // 2. Poi i più recenti
        desc(blogPosts.publishedAt)
      )
      .limit(limit)

    // 4. Formattazione risposta (stesso formato del mock originale)
    return related.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category || 'Senza categoria',
      date: post.date ? new Date(post.date).toISOString().split('T')[0] : null
    }))
  } catch (error) {
    console.error('[API /blog/related] Errore:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore nel recupero dei post correlati'
    })
  }
})