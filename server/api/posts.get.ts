// server/api/posts.get.ts
import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const dbUrl = config.databaseUrl || process.env.DATABASE_URL

  if (!dbUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL non configurata nel file .env'
    })
  }

  const sql = neon(dbUrl)

  try {
    // Query SQL diretta blindata con JOIN sicuro
    const rawPosts = await sql`
      SELECT 
        p.id,
        p.title,
        p.url,
        p.content,
        p.points,
        p.created_at,
        p.user_id,
        COALESCE(u.username, 'alexdpl') as author,
        COALESCE(u.role, 'admin') as author_role
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100;
    `

    return {
      success: true,
      data: rawPosts
    }
  } catch (error: any) {
    console.error('Errore Fetch News Feed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore caricamento feed notizie: ${error.message || error}`
    })
  }
})