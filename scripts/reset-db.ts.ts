// scripts/reset-db.ts
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../server/db/schema'
import { sql as sqlQuery } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL non trovata nelle variabili ambiente.')
  process.exit(1)
}

const sql = neon(connectionString)
const db = drizzle(sql, { schema })

async function resetDB() {
  console.log('🧹 Svuotamento totale del database Neon...')

  try {
    // Cancella tutti i dati e resetta i contatori degli ID
    await db.execute(sqlQuery`TRUNCATE TABLE "blog_posts", "blog_subcategories", "blog_categories" RESTART IDENTITY CASCADE;`)

    console.log('✅ Database completamente svuotato.')

    // Crea le Categorie e Sottocategorie reali di base
    const [cat1] = await db.insert(schema.blogCategories).values({
      name: 'Tech & Architecture',
      slug: 'tech-architecture',
      description: 'Architetture software e sviluppo cloud',
      icon: '🧬',
      color: '#4410bc'
    }).returning()

    const [cat2] = await db.insert(schema.blogCategories).values({
      name: 'Cloud & DevOps',
      slug: 'cloud-devops',
      description: 'Infrastrutture, Docker e CI/CD',
      icon: '☁️',
      color: '#38bdf8'
    }).returning()

    await db.insert(schema.blogSubcategories).values([
      { name: 'Software Architecture', slug: 'software-architecture', categoryId: cat1.id },
      { name: 'Design Patterns', slug: 'design-patterns', categoryId: cat1.id },
      { name: 'Docker & K8s', slug: 'docker-k8s', categoryId: cat2.id },
      { name: 'CI/CD Pipelines', slug: 'cicd-pipelines', categoryId: cat2.id }
    ])

    console.log('🌱 Create 2 categorie base con 4 sottocategorie reali su Neon DB!')
    console.log('✨ Il Blog è ora vergine e pronto per creare post dall\'Admin!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Errore durante il reset:', error)
    process.exit(1)
  }
}

resetDB()