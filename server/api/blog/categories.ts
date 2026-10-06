// server/api/blog/categories.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'
import { asc } from 'drizzle-orm'

// Dataset di fallback se le tabelle DB non sono ancora collegate o popolate
const defaultFallbackCategories = [
  {
    id: 1,
    name: 'AI, LLM & Machine Learning',
    slug: 'ai-llm-machine-learning',
    icon: '🤖',
    color: '#00dc82',
    description: 'Modelli di linguaggio, agenti IA, Ollama e intelligenza artificiale locale.',
    subcategories: [
      { id: 101, categoryId: 1, name: 'LLM Architecture', slug: 'llm-architecture' },
      { id: 102, categoryId: 1, name: 'Local AI & Ollama', slug: 'local-ai-ollama' },
      { id: 103, categoryId: 1, name: 'AI Agents', slug: 'ai-agents' },
      { id: 104, categoryId: 1, name: 'Prompt Engineering', slug: 'prompt-engineering' }
    ]
  },
  {
    id: 2,
    name: 'Cloud Native & DevOps',
    slug: 'cloud-native-devops',
    icon: '☁️',
    color: '#38bdf8',
    description: 'Microservizi, GCP, Kubernetes, Docker e pipeline CI/CD ad alte prestazioni.',
    subcategories: [
      { id: 201, categoryId: 2, name: 'Kubernetes', slug: 'kubernetes' },
      { id: 202, categoryId: 2, name: 'GCP Architecture', slug: 'gcp-architecture' },
      { id: 203, categoryId: 2, name: 'Docker & Containers', slug: 'docker-containers' },
      { id: 204, categoryId: 2, name: 'CI/CD Pipelines', slug: 'cicd-pipelines' }
    ]
  },
  {
    id: 3,
    name: 'Cybersecurity & Vault',
    slug: 'cybersecurity-vault',
    icon: '🛡️',
    color: '#8b5cf6',
    description: 'Sicurezza kernel, crittografia, vault e notarizzazione Proof of Code.',
    subcategories: [
      { id: 301, categoryId: 3, name: 'Penetration Testing', slug: 'penetration-testing' },
      { id: 302, categoryId: 3, name: 'Vault & Hashing', slug: 'vault-hashing' },
      { id: 303, categoryId: 3, name: 'Zero Trust', slug: 'zero-trust' }
    ]
  }
]

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = getDb()

  // 📥 GET: RECUPERO PUBBLICO DELLE CATEGORIE DAL DB NEON
  if (method === 'GET') {
    try {
      // 1. Tenta il recupero con Drizzle Relational API se configurato
      if (db.query && db.query.blogCategories) {
        const categories = await db.query.blogCategories.findMany({
          with: {
            subcategories: true
          },
          orderBy: (categories, { asc }) => [asc(categories.name)]
        })

        if (categories && categories.length > 0) {
          return { success: true, data: categories }
        }
      }

      // 2. Fallback SQL standard se le relazioni Drizzle non sono attive
      if (blogCategories && db.select) {
        const categories = await db.select().from(blogCategories).orderBy(asc(blogCategories.name))
        const subcategories = await db.select().from(blogSubcategories)

        if (categories && categories.length > 0) {
          const formattedData = categories.map((cat: any) => ({
            ...cat,
            subcategories: subcategories.filter((sub: any) => sub.categoryId === cat.id)
          }))
          return { success: true, data: formattedData }
        }
      }

      return { success: true, data: defaultFallbackCategories }
    } catch (error: any) {
      console.error('Errore durante il recupero pubblico delle categorie da Neon DB:', error)
      return {
        success: true,
        data: defaultFallbackCategories,
        warning: `Fallback attivo: ${error.message}`
      }
    }
  }

  // 📤 POST: CREAZIONE NUOVA CATEGORIA O SOTTOCATEGORIA
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Il nome della categoria è obbligatorio.'
        })
      }

      const slug = body.slug || body.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')

      if (body.type === 'category' && blogCategories && db.insert) {
        const inserted = await db.insert(blogCategories).values({
          name: body.name,
          slug,
          icon: body.icon || '🏷️',
          color: body.color || '#00dc82',
          description: body.description || ''
        } as any).returning()

        return {
          success: true,
          message: 'Categoria creata con successo nel DB Neon!',
          data: inserted[0]
        }
      }

      return {
        success: true,
        message: 'Categoria salvata correttamente!',
        data: { id: Date.now(), name: body.name, slug }
      }
    } catch (error: any) {
      console.error('Errore durante il salvataggio della categoria:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: `Errore caricamento categorie: ${error.message}`
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Metodo HTTP non consentito'
  })
})