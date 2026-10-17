// server/api/blog/posts/[id].put.ts
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts, blogCategories, blogSubcategories } from '~~/drizzle/schema'

function slugify(text: string): string {
  return text.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0')
  if (!id) return { success: false, statusMessage: 'ID articolo mancante.' }

  const body = await readBody(event)
  const db = await getDb()

  try {
    let categoryId = null
    let subcategoryId = null

    // Recuperiamo l'ID della categoria dal nome passato dal frontend
    if (body.category) {
      const cats = await db.select().from(blogCategories).where(eq(blogCategories.name, body.category)).limit(1)
      if (cats.length > 0) categoryId = cats[0].id
    }

    // Recuperiamo l'ID della sottocategoria
    if (body.subCategory) {
      const subs = await db.select().from(blogSubcategories).where(eq(blogSubcategories.name, body.subCategory)).limit(1)
      if (subs.length > 0) subcategoryId = subs[0].id
    }

    // 🟢 Dati da aggiornare (inclusi i TAG)
    const updateData: any = {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      tags: body.tags, // Drizzle gestisce automaticamente array/jsonb
      status: body.status
    }

    if (categoryId) updateData.categoryId = categoryId
    if (subcategoryId) updateData.subcategoryId = subcategoryId
    if (body.title) updateData.slug = slugify(body.title) // Aggiorna lo slug se cambia il titolo

    // Eseguiamo l'UPDATE effettivo su Neon DB
    await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))

    return { success: true, message: 'Articolo aggiornato con successo' }
  } catch (err: any) {
    console.error('💥 Errore PUT update post:', err)
    return { success: false, statusMessage: err.message || 'Errore interno' }
  }
})