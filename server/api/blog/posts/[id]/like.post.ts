// server/api/blog/posts/[id]/like.post.ts
import { defineEventHandler, getRouterParam, setCookie, getCookie, createError } from 'h3'
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

  const cookieName = `dkp_liked_${id}`
  const alreadyLiked = getCookie(event, cookieName)

  if (alreadyLiked) {
    return { success: false, message: 'Hai già assegnato karma a questo articolo!' }
  }

  const sql = getSqlClient()

  try {
    await sql`
      UPDATE blog_posts 
      SET likes = COALESCE(likes, 0) + 1 
      WHERE id = ${Number(id)}
    `

    setCookie(event, cookieName, 'true', { maxAge: 60 * 60 * 24 })

    return { success: true, message: 'Karma assegnato!' }
  } catch (error: any) {
    console.error(`Errore incremento like per post ${id}:`, error.message)
    return { success: false, error: error.message }
  }
})