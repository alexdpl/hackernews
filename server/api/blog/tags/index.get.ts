// server/api/blog/tags/index.get.ts
import { defineEventHandler } from 'h3'
import { getDb } from '~~/server/utils/db'
// 🔥 FIX: Import dello schema blogPosts corretto
import { blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async () => {
  try {
    const db = getDb()
    
    // Tenta Drizzle Relational Queries prima
    let posts = []
    if (db.query && db.query.blogPosts) {
      posts = await db.query.blogPosts.findMany({
        columns: { tags: true }
      })
    } else {
      // Fallback SQL
      posts = await db.select({ tags: blogPosts.tags }).from(blogPosts)
    }

    const allTags = new Set<string>()
    posts.forEach((p: any) => {
      let tagsList: string[] = []
      if (Array.isArray(p.tags)) {
        tagsList = p.tags
      } else if (typeof p.tags === 'string') {
        try { tagsList = JSON.parse(p.tags) } catch { tagsList = [] }
      }
      tagsList.forEach((t) => {
        if (t && t.trim()) allTags.add(t.trim())
      })
    })

    return {
      success: true,
      data: Array.from(allTags)
    }
  } catch (error: any) {
    console.error('Errore estrazione tags:', error)
    return { success: false, data: [] }
  }
})