// audit-ecosystem.mjs
import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const connectionString = process.env.DATABASE_URL

async function runEcosystemAudit() {
  console.log('==================================================')
  console.log('🔍 [DKP ECOSYSTEM AUDIT] Avvio analisi globale...')
  console.log('==================================================\n')

  let errorsFound = 0

  // 1. Check delle Variabili d'Ambiente
  console.log('1️⃣ Controllo Configurazione & Database...')
  if (!connectionString) {
    console.error('   ❌ ERRORE: DATABASE_URL mancante nel file .env!')
    errorsFound++
  } else {
    console.log('   ✅ DATABASE_URL configurata correttamente.')
  }

  // 2. Check del Database Neon & Tabelle Critiche
  let sql = null
  try {
    sql = postgres(connectionString, { ssl: 'require', max: 2 })
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `
    const tableNames = tables.map(t => t.table_name)
    console.log('   📊 Tabelle trovate nel DB:', tableNames.join(', '))

    const requiredTables = ['blog_posts', 'users', 'blog_categories']
    for (const req of requiredTables) {
      if (!tableNames.includes(req)) {
        console.error(`   ❌ ERRORE: Tabella obbligatoria '${req}' mancante nel database!`)
        errorsFound++
      } else {
        console.log(`   ✅ Tabella '${req}' presente.`)
      }
    }
  } catch (err) {
    console.error('   ❌ ERRORE di connessione al database Neon:', err.message)
    errorsFound++
  }

  // 3. Check dei Post e degli Slug nel Database
  console.log('\n2️⃣ Analisi Articoli e Slug nel Database...')
  try {
    const posts = await sql`SELECT id, title, slug, status, category_id, author_id FROM blog_posts;`
    console.log(`   📦 Totale articoli nel DB: ${posts.length}`)
    
    posts.forEach((p, idx) => {
      const hasSlug = !!p.slug && p.slug.trim() !== ''
      if (!hasSlug) {
        console.warn(`   ⚠️ Attenzione: Il post ID ${p.id} ("${p.title}") non ha uno slug valido!`)
      } else {
        console.log(`   - Post #${p.id}: "${p.title.substring(0, 30)}..." [Slug: ${p.slug}]`)
      }
    })
  } catch (err) {
    console.error('   ❌ Errore durante la lettura dei post:', err.message)
    errorsFound++
  }

  // 4. Check della struttura delle cartelle API (Server Endpoints)
  console.log('\n3️⃣ Controllo Struttura Endpoint Server (Nitro)...')
  const postsApiDir = path.join(process.cwd(), 'server', 'api', 'blog', 'posts')
  if (fs.existsSync(postsApiDir)) {
    const files = fs.readdirSync(postsApiDir)
    console.log('   📂 File trovati in server/api/blog/posts/:', files.join(', '))
    
    // Verifica conflitti tipici
    const hasIdFile = files.includes('[id].ts') || files.includes('[id].get.ts')
    const hasSlugFile = files.includes('[slug].ts') || files.includes('[slug].get.ts')
    
    if (hasIdFile && hasSlugFile) {
      console.warn('   ⚠️ CONFLITTO POTENZIALE: Coesistono endpoint [id] e [slug] nella stessa cartella!')
      errorsFound++
    }
  } else {
    console.error('   ❌ ERRORE: La cartella server/api/blog/posts non esiste!')
    errorsFound++
  }

  // 5. Check delle pagine Frontend
  console.log('\n4️⃣ Controllo Pagine Frontend...')
  const frontendSlugPage = path.join(process.cwd(), 'app', 'pages', 'blog', '[slug].vue')
  if (fs.existsSync(frontendSlugPage)) {
    console.log('   ✅ Pagina frontend app/pages/blog/[slug].vue presente.')
  } else {
    console.error('   ❌ ERRORE: Manca la pagina frontend app/pages/blog/[slug].vue!')
    errorsFound++
  }

  console.log('\n==================================================')
  if (errorsFound === 0) {
    console.log('🎉 AUDIT COMPLETATO: Nessuna criticità strutturale evidente nel backend/database.')
  } else {
    console.log(`⚠️ AUDIT COMPLETATO: Rilevate ${errorsFound} anomalie da sistemare sopra riportate.`)
  }
  console.log('==================================================')

  if (sql) await sql.end()
}

runEcosystemAudit()