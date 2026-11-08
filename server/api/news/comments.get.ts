// server/api/news/comments.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const slugParam = query.slug ? String(query.slug).trim() : ''

    // Se lo slug manca (es. chiamata iniziale vuota), restituiamo semplicemente un array vuoto
    // invece di bloccare con un errore 400 che sporca i log.
    if (!slugParam) {
      return {
        success: true,
        comments: []
      }
    }

    // Estrazione intelligente dell'ID numerico dalla fine dello slug (es. "kodivo-821" -> "821")
    const parts = slugParam.split('-')
    const possibleId = parts[parts.length - 1] || slugParam

    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })
    }

    // Assicuriamoci che la tabella esista (creazione automatica di sicurezza se non presente)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS news_comments (
        id SERIAL PRIMARY KEY,
        story_slug VARCHAR(255) NOT NULL,
        author VARCHAR(100) DEFAULT 'Developer',
        author_username VARCHAR(100) DEFAULT 'dev_kernel',
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Recupera i commenti associati sia tramite lo slug completo che tramite l'ID estratto
    const result: any = await db.execute(sql`
      SELECT 
        id,
        story_slug AS "storySlug",
        author,
        author_username AS "authorUsername",
        content,
        created_at AS "createdAt"
      FROM news_comments
      WHERE story_slug = ${slugParam} 
         OR story_slug = ${possibleId}
      ORDER BY created_at DESC
    `)

    const comments = result.rows || result || []

    return {
      success: true,
      comments
    }
  } catch (err: any) {
    console.error('❌ [API Comments Get Error]:', err)
    if (err.statusCode) throw err
    
    return {
      success: true,
      comments: []
    }
  }
})