// server/api/blog/posts/[id].delete.ts
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0')
  if (!id) return { success: false, statusMessage: 'ID articolo mancante.' }

  const db = await getDb()

  try {
    // 🟢 Elimina fisicamente la riga dalla tabella blog_posts
    await db.delete(blogPosts).where(eq(blogPosts.id, id))

    return { success: true, message: 'Articolo eliminato con successo' }
  } catch (err: any) {
    console.error('💥 Errore DELETE post:', err)
    return { success: false, statusMessage: err.message || 'Errore interno' }
  }
})