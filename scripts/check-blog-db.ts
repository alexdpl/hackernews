import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../server/db/schema'

const connectionString = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL non trovata nel file .env')
  process.exit(1)
}

const sql = neon(connectionString)
const db = drizzle(sql, { schema })

async function checkBlog() {
  console.log('🔍 Controllo effettivo tabelle BLOG su Neon DB...\n')

  try {
    const categories = await db.query.blogCategories.findMany()
    console.log(`📂 Categorie nel DB (${categories.length}):`)
    categories.forEach((c) => console.log(`   - [ID ${c.id}] ${c.name} (${c.slug})`))

    const subcategories = await db.query.blogSubcategories.findMany()
    console.log(`\n📁 Sottocategorie nel DB (${subcategories.length}):`)
    subcategories.forEach((s) => console.log(`   - [ID ${s.id}] ${s.name} (Cat ID: ${s.categoryId})`))

    const posts = await db.query.blogPosts.findMany()
    console.log(`\n📰 Articoli nel DB (${posts.length}):`)
    posts.forEach((p) => console.log(`   - [ID ${p.id}] ${p.title} (Cat ID: ${p.categoryId})`))

  } catch (error) {
    console.error('❌ Errore durante il controllo:', error)
  }
  process.exit(0)
}

checkBlog()