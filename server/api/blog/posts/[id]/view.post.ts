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
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    return { success: false, message: 'ID non valido' }
  }

  const sql = getSqlClient()

  try {
    await sql`
      UPDATE blog_posts 
      SET views = COALESCE(views, 0) + 1 
      WHERE id = ${Number(id)}
    `

    return { success: true }
  } catch (error: any) {
    console.error(`Errore incremento view per post ${id}:`, error.message)
    return { success: false, error: error.message }
  }
})