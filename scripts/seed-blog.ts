// scripts/seed-blog.ts
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../server/db/schema'
import { eq } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL

if (!connectionString) {
  console.error('❌ Errore: Nessuna stringa di connessione trovata in .env (DATABASE_URL o NUXT_DATABASE_URL)')
  process.exit(1)
}

const sql = neon(connectionString)
const db = drizzle(sql, { schema })

async function seed() {
  console.log('🌱 Avvio popolamento Database Neon...')

  try {
    // 1. Inserisci o recupera l'Utente / Autore predefinito
    let authorId: number | null = null

    // Verifica la tabella utenti disponibile nello schema (blogUsers o users o authors)
    const usersTable = schema.blogUsers || (schema as any).users || (schema as any).authors

    if (usersTable) {
      const userQueryKey = schema.blogUsers ? 'blogUsers' : 'users'
      let author = await (db.query as any)[userQueryKey]?.findFirst()

      if (!author) {
        const [newAuthor] = await db.insert(usersTable).values({
          name: 'Alessandro De Paola',
          email: 'alex@devkernelpulse.org',
          role: 'admin'
        }).returning()
        author = newAuthor
        console.log(`✅ Autore creato: ${author.name} (ID: ${author.id})`)
      } else {
        console.log(`ℹ️ Autore già presente: ${author.name || author.email} (ID: ${author.id})`)
      }
      authorId = author.id
    }

    // 2. Inserisci o recupera la categoria di default
    let category = await db.query.blogCategories.findFirst({
      where: eq(schema.blogCategories.slug, 'tech-architecture')
    })

    if (!category) {
      const [newCategory] = await db.insert(schema.blogCategories).values({
        name: 'Tech & Architecture',
        slug: 'tech-architecture',
        description: 'Articoli su sviluppo, cloud ed ecosistemi web.'
      }).returning()
      category = newCategory
      console.log(`✅ Categoria creata: ${category.name} (ID: ${category.id})`)
    } else {
      console.log(`ℹ️ Categoria già presente: ${category.name} (ID: ${category.id})`)
    }

    // 3. Definizione articoli con authorId e categoryId
    const postsToSeed = [
      {
        title: 'Benvenuti nel nuovo Blog DevKernelPulse',
        slug: 'benvenuti-devkernelpulse',
        excerpt: 'Primi passi nell’ecosistema basato su Nuxt 4, Drizzle e Neon DB.',
        content: '# Benvenuti\n\nQuesto è il primo articolo reale salvato direttamente nel database PostgreSQL di Neon.',
        published: true,
        status: 'published',
        categoryId: category.id,
        authorId: authorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Ottimizzazione delle Build in ambienti Cloud GCP',
        slug: 'ottimizzazione-build-gcp',
        excerpt: 'Guida pratica all’allineamento degli ambienti tra locale e Google Cloud.',
        content: '# Build GCP\n\nCome configurare al meglio la pipeline CI/CD eliminando i colli di bottiglia.',
        published: true,
        status: 'published',
        categoryId: category.id,
        authorId: authorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // 4. Inserimento sicuro degli articoli
    for (const postData of postsToSeed) {
      const existingPost = await db.query.blogPosts.findFirst({
        where: eq(schema.blogPosts.slug, postData.slug)
      })

      if (!existingPost) {
        await db.insert(schema.blogPosts).values(postData)
        console.log(`✅ Inserito articolo: "${postData.title}"`)
      } else {
        console.log(`ℹ️ Articolo già presente nel DB: "${postData.title}"`)
      }
    }

    console.log('🚀 Popolamento completato con successo!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Errore durante il seed:', error)
    process.exit(1)
  }
}

seed()