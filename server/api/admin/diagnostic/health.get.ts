// server/api/admin/diagnostic/health.get.ts
import { defineEventHandler } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'
import { 
  blogPosts, 
  posts, 
  pulseStories, 
  users, 
  blogCategories,
  vaultCerts 
} from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const startTime = performance.now()
  
  try {
    const db = await getDb()

    // ⚡ Eseguiamo tutte le count in parallelo per massima efficienza serverless
    const [
      blogPostsCount,
      oldPostsCount,
      storiesCount,
      usersCount,
      categoriesCount,
      verifiedPostsCount,
      certsCount,
      dbPing
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(blogPosts),
      db.select({ count: sql<number>`count(*)` }).from(posts),
      db.select({ count: sql<number>`count(*)` }).from(pulseStories),
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(blogCategories),
      db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(sql`${blogPosts.isVerified} = true`),
      db.select({ count: sql<number>`count(*)` }).from(vaultCerts),
      db.execute(sql`SELECT 1`) // Ping crudo al DB per verificare la latenza reale
    ])

    const latencyMs = (performance.now() - startTime).toFixed(2)
    const blogCount = Number(blogPostsCount[0]?.count || 0)
    const oldCount = Number(oldPostsCount[0]?.count || 0)

    // 🧠 Logica di Diagnostica Intelligente
    let diagnosticMessage = "✅ Sistema Operativo. Tabelle allineate."
    let statusFlag: 'ONLINE' | 'WARNING' | 'CRITICAL' = 'ONLINE'

    if (blogCount === 0 && oldCount > 0) {
      diagnosticMessage = "⚠️ ANOMALIA RILEVATA: Gli articoli vengono salvati nella vecchia tabella 'posts' (News Hub) invece che in 'blog_posts'. Controllare l'editor Utente."
      statusFlag = 'WARNING'
    }

    return {
      success: true,
      system: {
        status: statusFlag,
        uptime: process.uptime(),
        latency: `${latencyMs}ms`,
        timestamp: new Date().toISOString(),
      },
      database: {
        status: 'CONNECTED',
        provider: 'Neon Serverless Postgres',
        environment: process.env.NODE_ENV || 'development'
      },
      vault: {
        engine: 'Pulse Sentinel AI v2.5 Gold',
        status: 'ACTIVE',
        metrics: {
          totalVerifiedArticles: Number(verifiedPostsCount[0]?.count || 0),
          independentCertsGenerated: Number(certsCount[0]?.count || 0)
        }
      },
      tables: {
        master_blog_posts: blogCount,      // Tabella V2.5
        legacy_user_posts: oldCount,       // Tabella Vecchia (Spesso causa di conflitti)
        crawler_stories: Number(storiesCount[0]?.count || 0),
        registered_users: Number(usersCount[0]?.count || 0),
        taxonomies: Number(categoriesCount[0]?.count || 0)
      },
      insights: {
        message: diagnosticMessage
      }
    }

  } catch (error: any) {
    console.error('[DKP Diagnostic] Health Check Failed:', error)
    
    return {
      success: false,
      system: {
        status: 'CRITICAL',
        latency: `${(performance.now() - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      },
      database: {
        status: 'DISCONNECTED',
        error: error.message
      },
      insights: {
        message: "❌ CONNESSIONE AL DATABASE FALLITA. Verifica le variabili d'ambiente (DATABASE_URL)."
      }
    }
  }
})