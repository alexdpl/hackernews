// server/api/admin/crawler/run.post.ts
import { neon } from '@neondatabase/serverless'

interface HackerNewsItem {
  id: number
  title: string
  url?: string
  by: string
  score: number
  time: number
  type: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) || {}
  const limit = body.limit || 10

  const dbUrl = config.databaseUrl || process.env.DATABASE_URL
  if (!dbUrl) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL assente' })
  }

  const sql = neon(dbUrl)

  try {
    // 1. Garantisci la presenza dell'utente Admin 'alexdpl' con solo i campi core di 'users'
    let adminUsers = await sql`
      INSERT INTO users (username, email, role)
      VALUES ('alexdpl', 'alexdpl@devkernelpulse.org', 'admin')
      ON CONFLICT (username) DO UPDATE SET role = 'admin'
      RETURNING id;
    `
    
    let adminId = adminUsers[0]?.id
    if (!adminId) {
      const found = await sql`SELECT id FROM users WHERE username = 'alexdpl' LIMIT 1;`
      adminId = found[0]?.id || 1
    }

    // 2. Fetch delle storie principali da HackerNews API
    const storyIds = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
    const targetIds = storyIds.slice(0, limit)

    let importedCount = 0

    // 3. Inserimento post collegati all'adminId nel database Neon
    for (const id of targetIds) {
      const item = await $fetch<HackerNewsItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)

      if (item && item.type === 'story' && item.title) {
        const title = item.title
        const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`
        const content = `Inviato originariamente da @${item.by} | Voti community: ${item.score} PTS. Verificato dal DKP Crawler Kernel.`
        const points = item.score || 10
        const createdAt = new Date(item.time * 1000).toISOString()

        await sql`
          INSERT INTO posts (title, url, content, user_id, points, created_at)
          VALUES (${title}, ${url}, ${content}, ${adminId}, ${points}, ${createdAt})
        `
        importedCount++
      }
    }

    return {
      success: true,
      count: importedCount,
      message: `🚀 Crawler DKP ha ingerito con successo ${importedCount} notizie reali in Neon DB!`
    }
  } catch (error: any) {
    console.error('Errore Crawler:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore durante l'esecuzione del Crawler: ${error.message || error}`
    })
  }
})