// server/api/admin/diagnostic/repair.post.ts
import { defineEventHandler } from 'h3'
import { getDb } from '~~/server/utils/db'
import { eq, desc } from 'drizzle-orm'
import { posts, blogPosts } from '~~/drizzle/schema'
import crypto from 'node:crypto'

function slugify(text: string): string {
  return text.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb()

    // 1. Cerca gli articoli persi nella tabella 'posts' 
    // (Presumiamo che gli articoli del blog finiti lì abbiano testo lungo in content)
    const orphanPosts = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(10)
    
    if (orphanPosts.length === 0) {
      return { success: true, migratedCount: 0, message: "Nessun articolo orfano trovato da migrare." }
    }

    let migratedCount = 0

    // 2. Migrazione verso blog_posts
    for (const oldPost of orphanPosts) {
      // Evitiamo di migrare post vuoti
      if (!oldPost.title || !oldPost.content) continue;

      const generatedSlug = slugify(oldPost.title) + '-' + Math.random().toString(36).substring(2, 6)
      const vaultHash = crypto.createHash('sha256').update(`dkp-repair-${Date.now()}-${generatedSlug}`).digest('hex')

      // Inseriamo nella nuova tabella Enterprise
      await db.insert(blogPosts).values({
        title: oldPost.title,
        slug: generatedSlug,
        content: oldPost.content,
        excerpt: oldPost.content.substring(0, 150) + '...',
        authorId: oldPost.userId, // Mappiamo l'utente corretto
        categoryId: 1, // Fallback su categoria ID 1
        status: 'published',
        isVerified: true,
        vaultCertificateId: `DKP-REPAIR-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        vaultHash: vaultHash,
        views: 0,
        likes: oldPost.points || 0
      })

      // 3. Rimuoviamo il post obsoleto dalla vecchia tabella per pulizia
      await db.delete(posts).where(eq(posts.id, oldPost.id))
      migratedCount++
    }

    return { 
      success: true, 
      migratedCount, 
      message: `Migrazione completata. ${migratedCount} articoli trasferiti.` 
    }

  } catch (error: any) {
    console.error('[DKP Auto-Repair Error]:', error)
    return { success: false, message: error.message }
  }
})