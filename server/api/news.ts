// server/api/news.ts
import { posts } from '~~/server/db/schema' // Punta alla cartella db nella radice
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt))

    return allPosts.map(post => ({
      id: post.id,
      title: post.title,
      url: post.url,
      time: post.createdAt ? Math.floor(new Date(post.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
      score: 1,
      by: 'Utente',
      descendants: 0, 
      type: 'link'
    }))
  } catch (error) {
    console.error('Errore nel recupero dei post da Neon:', error)
    return []
  }
})