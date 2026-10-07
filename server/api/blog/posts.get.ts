// server/api/blog/posts.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/server/db/schema'

// Utility per estrarre i Query Parameters in sicurezza senza crash SSR su URL relativi
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
    const db = getDb()
    let postsList: any[] = []

    // 1. Recupera gli articoli pubblicati dal DB Neon
    if (db.query && db.query.blogPosts) {
      postsList = await db.query.blogPosts.findMany({
        where: eq(blogPosts.status, 'published'),
        orderBy: [desc(blogPosts.createdAt)],
        with: {
          category: true,
          subcategory: true,
          author: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      })
    } else if (blogPosts) {
      postsList = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, 'published'))
        .orderBy(desc(blogPosts.createdAt))
    }

    // 2. Se il DB è in prima inizializzazione o privo di righe, usa i fallback
    if (!postsList || postsList.length === 0) {
      postsList = defaultFallbackPosts
    }

    // 3. Filtro Categoria e Sottocategoria
    let filteredPosts = [...postsList]

    if (categorySlug) {
      filteredPosts = filteredPosts.filter(
        (p) => p.category?.slug === categorySlug || String(p.categoryId) === categorySlug
      )
    }

    if (subcategorySlug) {
      filteredPosts = filteredPosts.filter(
        (p) => p.subcategory?.slug === subcategorySlug || String(p.subcategoryId) === subcategorySlug
      )
    }

    return {
      success: true,
      data: filteredPosts,
      total: filteredPosts.length,
    }
  } catch (error: any) {
    console.error('Errore durante il recupero dei post del blog:', error)

    return {
      success: true,
      data: defaultFallbackPosts,
      total: defaultFallbackPosts.length,
      warning: 'Fallback attivo: ' + error.message,
    }
  }
})

// Dataset dimostrativo di Fallback locale
const defaultFallbackPosts = [
  {
    id: 1,
    title: "Lancio Ufficiale DevKernelPulse v2.4-GOLD",
    slug: "lancio-ufficiale-devkernelpulse-v24-gold",
    excerpt: "Panoramica dell'architettura DKP e dei moduli difensivi.",
    status: "published",
    isVerified: true,
    vaultCertificateId: "DKP-VAULT-CERT-884A29-2026",
    views: 1420,
    createdAt: new Date().toISOString(),
    category: { id: 1, name: "AI, LLM & Machine Learning", slug: "ai-llm-machine-learning", icon: "🤖", color: "#00dc82" },
  },
  {
    id: 2,
    title: "Guida Completa a Vault & Hashing Avanzato su GCP",
    slug: "guida-completa-vault-hashing-avanzato",
    excerpt: "Metodologie di protezione del kernel e gestione avanzata delle chiavi crittografiche per ambienti cloud e serverless.",
    status: "published",
    isVerified: true,
    vaultCertificateId: "DKP-VAULT-CERT-112F88-2026",
    views: 890,
    createdAt: new Date().toISOString(),
    category: { id: 2, name: "Cybersecurity & Vault", slug: "cybersecurity-vault", icon: "🛡️", color: "#38bdf8" },
  }
]