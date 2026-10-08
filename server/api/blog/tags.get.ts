// server/api/blog/tags.get.ts
import { defineEventHandler } from 'h3'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const db = getDb()
    const posts = await db.query.blogPosts.findMany({
      columns: { tags: true }
    })

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
    return { success: false, data: [] }
  }
})