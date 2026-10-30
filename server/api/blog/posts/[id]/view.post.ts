// server/api/blog/posts/[id]/view.post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import postgres from 'postgres'

let sqlInstance: any = null
function getSqlClient() {
  if (sqlInstance) return sqlInstance
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL mancante.' })
  sqlInstance = postgres(connectionString, { ssl: 'require', max: 10 })
  return sqlInstance
}

export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, 'id')

  if (!param) {
    throw createError({ statusCode: 400, statusMessage: 'Parametro mancante.' })
  }

  const sql = getSqlClient()

  try {
    const isNumeric = !isNaN(Number(param))

    if (isNumeric) {
      await sql`
        UPDATE blog_posts 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = ${Number(param)}
      `
    } else {
      await sql`
        UPDATE blog_posts 
        SET views = COALESCE(views, 0) + 1 
        WHERE slug = ${param}
      `
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Errore incremento view per post ${param}:`, error.message)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})