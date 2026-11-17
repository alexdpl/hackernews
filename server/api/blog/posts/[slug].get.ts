// server/api/blog/posts/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { BlockchainService } from '../../../utils/blockchainService'
import { extractDkpUserFromEvent } from '../../../utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const rawSlug = String(getRouterParam(event, 'slug') || '').trim()
  if (!rawSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug articolo mancante.' })
  }

  if (rawSlug.length > 255) {
    throw createError({ statusCode: 400, statusMessage: 'Slug articolo non valido.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  try {
    await BlockchainService.ensureSchema(db)

    await db.execute(sql`
      ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS vault_block_number INTEGER;
    `).catch(() => null)

    const parsedNum = Number(rawSlug)
    const isNumericId =
      /^\d+$/.test(rawSlug) &&
      Number.isSafeInteger(parsedNum) &&
      parsedNum > 0 &&
      parsedNum <= 2147483647

    const whereCondition = isNumericId
      ? sql`(p.slug = ${rawSlug} OR p.id = ${parsedNum})`
      : sql`p.slug = ${rawSlug}`

    const result = await db.execute(sql`
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        sc.name AS subcategory_name,
        sc.slug AS subcategory_slug,
        COALESCE(u.username, 'Alessandro De Paola') AS author_name,
        COALESCE(u.xp, 0)::int AS author_xp
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN blog_subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE ${whereCondition}
      LIMIT 1;
    `)

    const row = extractRows(result)[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato.' })
    }

    // Protezione bozze / articoli in revisione Vault: visibili solo ad autore o ADMIN
    const postStatus = String(row.status || 'published')
    if (postStatus !== 'published') {
      const sessionUser = extractDkpUserFromEvent(event)
      let canPreview = false

      if (sessionUser?.id && Number(sessionUser.id) > 0) {
        const requesterRes = await db.execute(sql`
          SELECT id, role FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;
        `)
        const requester = extractRows(requesterRes)[0]
        if (requester) {
          const isOwner = Number(requester.id) === Number(row.author_id)
          const isAdmin = String(requester.role || '').toUpperCase() === 'ADMIN'
          canPreview = isOwner || isAdmin
        }
      }

      if (!canPreview) {
        throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato.' })
      }
    }

    const postId = Number(row.id)
    let vaultHash = row.vault_hash || null
    let vaultBlockNumber = row.vault_block_number ? Number(row.vault_block_number) : null

    // Notarizza automaticamente solo gli articoli pubblicati che non hanno ancora un blocco nel ledger
    if (postStatus === 'published' && (!vaultHash || !vaultBlockNumber)) {
      const proof = await BlockchainService.notarizeEntity(db, {
        entityType: 'blog',
        entityId: postId,
        title: row.title || '',
        content: row.content || row.excerpt || ''
      }).catch(() => null)

      if (proof) {
        vaultHash = proof.vaultHash
        vaultBlockNumber = proof.blockNumber
      }
    }

    let tagsArray: string[] = []
    if (Array.isArray(row.tags)) {
      tagsArray = row.tags
    } else if (typeof row.tags === 'string') {
      try {
        tagsArray = JSON.parse(row.tags)
      } catch {
        tagsArray = row.tags
          .replace(/^\{|\}$/g, '')
          .split(',')
          .map((t: string) => t.replace(/^"|"$/g, '').trim())
          .filter(Boolean)
      }
    }

    const normalized = {
      ...row,
      id: postId,
      status: postStatus,
      categoryName: row.category_name || 'Generale',
      category: row.category_name || 'Generale',
      subcategoryName: row.subcategory_name || '',
      subCategory: row.subcategory_name || '',
      authorName: row.author_name || 'Alessandro De Paola',
      authorXp: Number(row.author_xp || 0),
      isVerified: Boolean(row.is_verified),
      vaultCertificateId: row.vault_certificate_id || `DKP-VAULT-BLOG-${postId}`,
      vaultHash,
      vaultBlockNumber,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      views: Number(row.views || 0),
      likes: Number(row.likes || 0),
      tags: tagsArray
    }

    return {
      success: true,
      data: normalized
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [BLOG POST SLUG GET ERROR]:', err?.message)
    throw createError({ statusCode: 500, statusMessage: 'Errore durante il recupero dell\'articolo.' })
  }
})