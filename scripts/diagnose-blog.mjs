// diagnose-blog.mjs
import postgres from 'postgres'
import dotenv from 'dotenv'

// Carica le variabili d'ambiente dal file .env se presente
dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ ERRORE CRITICO: DATABASE_URL non trovata nel file .env o nelle variabili d\'ambiente!')
  process.exit(1)
}

const sql = postgres(connectionString, { ssl: 'require' })

async function runDiagnostics() {
  console.log('🔍 [DKP DIAGNOSTIC TOOL] Connessione al Neon DB in corso...\n')

  try {
    // 1. Controlliamo quanti post ci sono nel database
    const posts = await sql`SELECT id, title, slug, status FROM blog_posts ORDER BY id DESC;`
    
    console.log(`📊 Totale articoli trovati nel database: ${posts.length}`)
    if (posts.length === 0) {
      console.warn('⚠️ Il database è vuoto! Nessun articolo trovato nella tabella blog_posts.')
    } else {
      console.log('--------------------------------------------------')
      posts.forEach((p, index) => {
        console.log(`[${index + 1}] ID: ${p.id} | Titolo: "${p.title}"`)
        console.log(`    Slug nel DB: "${p.slug}" | Stato: ${p.status}`)
        console.log(`    URL di test: /blog/${p.slug || p.id}`)
      })
      console.log('--------------------------------------------------')
    }

    // 2. Testiamo la rotta dell'API simulando una chiamata interna
    if (posts.length > 0) {
      const testSlug = posts[0].slug || posts[0].id
      console.log(`\n🧪 Test simulazione query per l'articolo: "${testSlug}"`)
      
      const queryResult = await sql`
        SELECT p.*, c.name as category_name, u.username as author_name 
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.slug = ${testSlug} OR p.id = ${isNaN(Number(testSlug)) ? 0 : Number(testSlug)}
        LIMIT 1;
      `

      if (queryResult.length > 0) {
        console.log('✅ Query SQL eseguita con successo! Dati recuperati correttamente:')
        console.log({
          id: queryResult[0].id,
          title: queryResult[0].title,
          slug: queryResult[0].slug,
          category: queryResult[0].category_name,
          author: queryResult[0].author_name
        })
      } else {
        console.error('❌ La query di test non ha restituito risultati per questo slug/id.')
      }
    }

  } catch (err) {
    console.error('💥 Errore durante la connessione o l\'esecuzione della query:', err.message)
  } finally {
    await sql.end()
    console.log('\n🏁 Diagnostica completata.')
  }
}

runDiagnostics()