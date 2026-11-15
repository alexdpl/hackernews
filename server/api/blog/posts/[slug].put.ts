// server/api/blog/posts/[slug].put.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { BlockchainService } from '../../../utils/blockchainService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const rawParam = String(getRouterParam(event, 'slug') || '').trim()
  if (!rawParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID o slug articolo mancante.' })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  const isNumericId = /^\d+$/.test(rawParam)
  const whereClause = isNumericId
    ? sql`(id = ${Number(rawParam)} OR slug = ${rawParam})`
    : sql`slug = ${rawParam}`

  const existing = extractRows(
    await db.execute(sql`SELECT * FROM blog_posts WHERE ${whereClause} LIMIT 1;`)
  )[0]

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato nel database.' })
  }

  const postId = Number(existing.id)
  const nextTitle = body.title !== undefined ? String(body.title).trim() : existing.title
  const nextContent = body.content !== undefined ? String(body.content) : existing.content
  const nextExcerpt = (body.excerpt ?? body.summary) !== undefined ? (body.excerpt ?? body.summary) : existing.excerpt
  const nextStatus = body.status !== undefined ? String(body.status) : existing.status

  const updated = extractRows(
    await db.execute(sql`
      UPDATE blog_posts
      SET
        title = ${nextTitle},
        content = ${nextContent},
        excerpt = ${nextExcerpt},
        status = ${nextStatus},
        updated_at = NOW()
      WHERE id = ${postId}
      RETURNING *;
    `)
  )[0]

  // Ri-notarizza il nuovo blocco nel Vault se cambia titolo o contenuto
  const proof = await BlockchainService.notarizeEntity(db, {
    entityType: 'blog',
    entityId: postId,
    title: nextTitle,
    content: nextContent
  }).catch(() => null)

  return {
    success: true,
    message: 'Articolo aggiornato con successo!',
    data: {
      ...updated,
      vaultHash: proof?.vaultHash || updated.vault_hash,
      vaultBlockNumber: proof?.blockNumber ?? updated.vault_block_number
    }
  }
})