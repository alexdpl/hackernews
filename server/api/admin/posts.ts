import { posts } from '../../db/schema'
import { desc } from 'drizzle-orm'
// getDb viene auto-importato da Nuxt da server/utils/db.ts, 
// ma se persistono problemi di risoluzione moduli puoi decommentare la riga sotto:
// import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }
  
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')

  if (!config.adminSecret || authHeader !== `Bearer ${config.adminSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const database = getDb()
    return await database.select().from(posts).orderBy(desc(posts.createdAt))
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Database connection failed' })
  }
})