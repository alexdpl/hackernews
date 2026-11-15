// server/api/blog/posts/index.get.ts
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { blogPosts, blogCategories, blogSubcategories, users } from '../../../../drizzle/schema'

function getSafeQuery(event: any): Record<string, any> {
  try {
    return getQuery(event) || {}
  } catch {
    const rawUrl = event.node?.req?.url || event.path || ''
    const search = rawUrl.includes('?') ? rawUrl.split('?')[1] : ''
    const params = new URLSearchParams(search)
    const result: Record<string, any> = {}
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    return result
  }
}

export default defineEventHandler(async (event) => {
  const query = getSafeQuery(event)
  const categorySlug = query.category ? String(query.category) : null
  const subcategorySlug = query.subcategory || query.subCategory ? String(query.subcategory || query.subCategory) : null

  try {
    const db = await getDb()
    let postsList: any[] = []

    const rawPosts = await db
      .select({
        post: blogPosts,
        category: blogCategories,
        subcategory: blogSubcategories,
        author: users,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(blogSubcategories, eq(blogPosts.subcategoryId, blogSubcategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .orderBy(desc(blogPosts.createdAt))

    postsList = rawPosts.map((row) => ({
      ...row.post,
      category: row.category,
      subcategory: row.subcategory,
      author: row.author ? { id: row.author.id, username: row.author.username, avatarUrl: row.author.avatarUrl } : null
    }))

    if (query.public === 'true') {
      postsList = postsList.filter((p) => p.status === 'published')
    }

    let filteredPosts = [...postsList]

    if (categorySlug) {
      filteredPosts = filteredPosts.filter(
        (p) =>
          p.category?.slug === categorySlug ||
          String(p.categoryId) === categorySlug ||
          p.category?.name?.toLowerCase() === categorySlug.toLowerCase()
      )
    }

    if (subcategorySlug) {
      filteredPosts = filteredPosts.filter(
        (p) =>
          p.subcategory?.slug === subcategorySlug ||
          String(p.subcategoryId) === subcategorySlug ||
          p.subcategory?.name?.toLowerCase() === subcategorySlug.toLowerCase()
      )
    }

    const normalizedPosts = filteredPosts.map((p) => {
      const catName = p.category?.name || 'Generale'
      const subName = p.subcategory?.name || ''
      const authorName = p.author?.username || 'Alessandro De Paola'

      let tagsArray: string[] = []
      if (Array.isArray(p.tags)) {
        tagsArray = p.tags
      } else if (typeof p.tags === 'string') {
        try {
          tagsArray = JSON.parse(p.tags)
        } catch {
          tagsArray = []
        }
      }

      return {
        ...p,
        category: catName,
        categoryName: catName,
        categoryObject: p.category,
        subCategory: subName,
        subcategoryName: subName,
        subcategoryObject: p.subcategory,
        authorName,
        vaultBlockNumber: (p as any).vaultBlockNumber ?? (p as any).vault_block_number ?? null,
        tags: tagsArray
      }
    })

    return {
      success: true,
      data: normalizedPosts,
      total: normalizedPosts.length,
    }
  } catch (error: any) {
    console.error('Errore durante il recupero dei post dal DB Neon:', error)
    return {
      success: false,
      data: [],
      total: 0,
      error: error.message,
    }
  }
})