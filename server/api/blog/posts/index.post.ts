// server/api/blog/posts/index.post.ts
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { BlockchainService } from '../../../utils/blockchainService'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
}

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  let body: any = {}
  try {
    body = (await readBody(event)) || {}
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Payload della richiesta non valido.' })
  }

  const {
    title,
    categoryId,
    category,
    subcategoryId,
    subCategory,
    excerpt,
    summary,
    content,
    tags,
    vaultHash: reqVaultHash,
    status
  } = body

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio.' })
  }

  const generatedSlug = slugify(cleanTitle)

  let cleanTags: string[] = []
  if (Array.isArray(tags)) {
    cleanTags = tags.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean)
  } else if (typeof tags === 'string') {
    cleanTags = tags
      .split(/[,;]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Connessione al database non disponibile.' })
  }

  try {
    await BlockchainService.ensureSchema(db)
    await db.execute(sql`
      ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS vault_block_number INTEGER;
    `).catch(() => null)

    // 1. Gestione Categoria
    let finalCategoryId = categoryId ? Number(categoryId) : null
    if (!finalCategoryId && category) {
      const foundCat = extractRows(
        await db.execute(sql`
          SELECT id FROM blog_categories
          WHERE name ILIKE ${category} OR slug ILIKE ${slugify(category)}
          LIMIT 1;
        `)
      )
      if (foundCat.length > 0) finalCategoryId = Number(foundCat[0].id)
    }

    if (!finalCategoryId) {
      const defaultCat = extractRows(await db.execute(sql`SELECT id FROM blog_categories LIMIT 1;`))
      if (defaultCat.length > 0) {
        finalCategoryId = Number(defaultCat[0].id)
      } else {
        throw createError({ statusCode: 400, statusMessage: 'Nessuna categoria disponibile nel DB.' })
      }
    }

    // 2. Gestione Sottocategoria
    let finalSubcategoryId = subcategoryId ? Number(subcategoryId) : null
    if (!finalSubcategoryId && subCategory) {
      const foundSub = extractRows(
        await db.execute(sql`
          SELECT id FROM blog_subcategories WHERE name ILIKE ${subCategory} LIMIT 1;
        `)
      )
      if (foundSub.length > 0) finalSubcategoryId = Number(foundSub[0].id)
    }

    // 3. Estrazione ID Autore reale
    const usersList = extractRows(await db.execute(sql`SELECT id FROM users ORDER BY id ASC LIMIT 1;`))
    const authorId = usersList[0]?.id ? Number(usersList[0].id) : null
    if (!authorId) {
      throw createError({ statusCode: 400, statusMessage: 'Nessun utente trovato nel DB per essere associato come autore.' })
    }

    // 4. Certificato & Inserimento Articolo Pure-SQL
    const certSuffix = (
      crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + 'AAAAAA'
    ).slice(0, 6)
    const vaultCertificateId = reqVaultHash
      ? `DKP-VAULT-CERT-VERIFIED-${certSuffix}`
      : `DKP-VAULT-CERT-ADMIN-${certSuffix}`

    const finalStatus = status || 'published'
    const finalExcerpt = excerpt || summary || null
    const finalContent = content || finalExcerpt || 'Contenuto non disponibile.'
    const pgTagsLiteral = `{${cleanTags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`

    const inserted = extractRows(
      await db.execute(sql`
        INSERT INTO blog_posts (
          title, slug, content, excerpt, category_id, subcategory_id, author_id,
          tags, status, is_verified, vault_certificate_id, views, likes
        ) VALUES (
          ${cleanTitle}, ${generatedSlug}, ${finalContent}, ${finalExcerpt},
          ${finalCategoryId}, ${finalSubcategoryId}, ${authorId},
          ${pgTagsLiteral}::text[], ${finalStatus}, true, ${vaultCertificateId}, 0, 0
        )
        RETURNING *;
      `)
    )

    const newPost = inserted[0]
    const postId = Number(newPost.id)

    // 5. Notarizzazione On-Chain nel DKP Vault Ledger unificato (Block #N + Merkle Root)
    const proof = await BlockchainService.notarizeEntity(db, {
      entityType: 'blog',
      entityId: postId,
      title: cleanTitle,
      content: finalContent
    })

    // 6. Assegnazione +150 XP protetta
    try {
      await db.execute(sql`
        UPDATE users
        SET xp = COALESCE(xp, 0) + 150
        WHERE id = ${authorId};
      `)
      await db.execute(sql`
        INSERT INTO xp_transactions (user_id, action, points)
        VALUES (${authorId}, ${`Pubblicazione articolo: "${cleanTitle.substring(0, 30)}..."`}, 150);
      `)
    } catch (xpError: any) {
      console.warn('⚠️ Warning XP non assegnati:', xpError.message)
    }

    return {
      success: true,
      message: 'Articolo pubblicato e notarizzato SHA-256 con successo!',
      data: {
        ...newPost,
        vault_hash: proof.vaultHash,
        vaultHash: proof.vaultHash,
        vault_block_number: proof.blockNumber,
        vaultBlockNumber: proof.blockNumber
      },
      proof
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('\n💥 [DKP VAULT ERROR] ERRORE INSERIMENTO POST:', error.message || error)

    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Un articolo con questo titolo o slug esiste già.' })
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB [${error.code || 'SQL_ERROR'}]: ${error.message}`
    })
	}
})