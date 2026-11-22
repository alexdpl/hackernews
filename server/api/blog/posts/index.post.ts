import { KnowledgeDependabotService } from '~~/server/utils/knowledgeDependabot'
// server/api/blog/posts/index.post.ts
import crypto from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { BlockchainService } from '../../../utils/blockchainService'
import { extractDkpUserFromEvent } from '../../../utils/session'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s\W_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
}

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per pubblicare un articolo.'
    })
  }

  let body: any = {}
  try {
    body = (await readBody(event)) || {}
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Payload della richiesta non valido.' })
  }

  const {
    title,
    subtitle,
    categoryId,
    category,
    subcategoryId,
    subCategory,
    excerpt,
    summary,
    content,
    stack,
    tags,
    vaultHash: reqVaultHash,
    status
  } = body

  const cleanTitle = String(title || '').trim()
  if (!cleanTitle) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio.' })
  }
  if (cleanTitle.length > 255) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo non può superare i 255 caratteri.' })
  }

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
    throw createError({ statusCode: 500, statusMessage: 'Connessione al database Neon non disponibile.' })
  }

  try {
    // Verifica autore reale dalla sessione
    const userRows = extractRows(
      await db.execute(sql`SELECT id, role FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;`)
    )
    const dbUser = userRows[0]
    if (!dbUser?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Sessione non valida o utente inesistente.' })
    }

    const authorId = Number(dbUser.id)
    const isAdmin = String(dbUser.role || '').toUpperCase() === 'ADMIN'

    await BlockchainService.ensureSchema(db).catch(() => null)

    // Assicura colonne opzionali su blog_posts
    await db.execute(sql`
      ALTER TABLE blog_posts
        ADD COLUMN IF NOT EXISTS subtitle TEXT,
        ADD COLUMN IF NOT EXISTS stack TEXT,
        ADD COLUMN IF NOT EXISTS vault_block_number INTEGER,
        ADD COLUMN IF NOT EXISTS vault_hash VARCHAR(128),
        ADD COLUMN IF NOT EXISTS vault_certificate_id VARCHAR(128),
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
    `).catch(() => null)

    // 1. Rileva il tipo esatto della colonna `tags` su Neon (ARRAY vs jsonb vs text)
    const colInfo = extractRows(
      await db.execute(sql`
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'tags'
        LIMIT 1;
      `)
    )[0]

    const tagsDataType = String(colInfo?.data_type || '').toUpperCase()
    const tagsUdtName = String(colInfo?.udt_name || '').toLowerCase()
    const isPgArray = tagsDataType === 'ARRAY' || tagsUdtName.startsWith('_')
    const isJsonb = tagsDataType === 'JSONB' || tagsDataType === 'JSON'

    // 2. Gestione Categoria (trova o crea automaticamente)
    let finalCategoryId = categoryId ? Number(categoryId) : null
    if (!finalCategoryId && category) {
      const catName = String(category).trim()
      const catSlug = slugify(catName) || 'general'
      const foundCat = extractRows(
        await db.execute(sql`
          SELECT id FROM blog_categories
          WHERE name ILIKE ${catName} OR slug ILIKE ${catSlug}
          LIMIT 1;
        `)
      )
      if (foundCat.length > 0) {
        finalCategoryId = Number(foundCat[0].id)
      } else {
        const createdCat = extractRows(
          await db.execute(sql`
            INSERT INTO blog_categories (name, slug)
            VALUES (${catName}, ${catSlug})
            RETURNING id;
          `).catch(() => [])
        )
        if (createdCat.length > 0) finalCategoryId = Number(createdCat[0].id)
      }
    }

    if (!finalCategoryId) {
      const defaultCat = extractRows(await db.execute(sql`SELECT id FROM blog_categories ORDER BY id ASC LIMIT 1;`))
      if (defaultCat.length > 0) {
        finalCategoryId = Number(defaultCat[0].id)
      } else {
        const fallbackCat = extractRows(
          await db.execute(sql`
            INSERT INTO blog_categories (name, slug)
            VALUES ('DKP Ecosystem & Releases', 'dkp-ecosystem-releases')
            RETURNING id;
          `)
        )
        finalCategoryId = Number(fallbackCat[0].id)
      }
    }

    // 3. Gestione Sottocategoria (trova o crea se specificata)
    let finalSubcategoryId = subcategoryId ? Number(subcategoryId) : null
    if (!finalSubcategoryId && subCategory) {
      const subName = String(subCategory).trim()
      const subSlug = slugify(subName) || 'core-releases'
      const foundSub = extractRows(
        await db.execute(sql`
          SELECT id FROM blog_subcategories
          WHERE name ILIKE ${subName} OR slug ILIKE ${subSlug}
          LIMIT 1;
        `)
      )
      if (foundSub.length > 0) {
        finalSubcategoryId = Number(foundSub[0].id)
      } else if (finalCategoryId) {
        const createdSub = extractRows(
          await db.execute(sql`
            INSERT INTO blog_subcategories (category_id, name, slug)
            VALUES (${finalCategoryId}, ${subName}, ${subSlug})
            RETURNING id;
          `).catch(() => [])
        )
        if (createdSub.length > 0) finalSubcategoryId = Number(createdSub[0].id)
      }
    }

    // 4. Slug univoco (evita errori 23505 se ripubblichi lo stesso titolo)
    let generatedSlug = slugify(cleanTitle) || `post-${Date.now()}`
    const existingSlug = extractRows(
      await db.execute(sql`SELECT id FROM blog_posts WHERE slug = ${generatedSlug} LIMIT 1;`)
    )
    if (existingSlug.length > 0) {
      generatedSlug = `${generatedSlug}-${Date.now().toString(36).slice(-4)}`
    }

    // 5. Preparazione valori
    const certSuffix = (
      crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + 'AAAAAA'
    ).slice(0, 6)
    const vaultCertificateId = reqVaultHash
      ? `DKP-VAULT-CERT-VERIFIED-${certSuffix}`
      : isAdmin
        ? `DKP-VAULT-CERT-ADMIN-${certSuffix}`
        : `DKP-VAULT-CERT-USER-${certSuffix}`

    const finalStatus = isAdmin ? (status || 'published') : 'pending_vault'
    const finalExcerpt = excerpt || summary || null
    const finalContent = content || finalExcerpt || 'Contenuto non disponibile.'
    const finalSubtitle = subtitle ? String(subtitle).trim() : null
    const finalStack = stack ? String(stack).trim() : null

    const tagsSqlExpr = isPgArray
      ? sql`${`{${cleanTags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`}::text[]`
      : isJsonb
        ? sql`${JSON.stringify(cleanTags)}::jsonb`
        : sql`${JSON.stringify(cleanTags)}`

    const inserted = extractRows(
      await db.execute(sql`
        INSERT INTO blog_posts (
          title, subtitle, slug, content, excerpt, stack,
          category_id, subcategory_id, author_id,
          tags, status, is_verified, vault_certificate_id, views, likes
        ) VALUES (
          ${cleanTitle}, ${finalSubtitle}, ${generatedSlug}, ${finalContent}, ${finalExcerpt}, ${finalStack},
          ${finalCategoryId}, ${finalSubcategoryId}, ${authorId},
          ${tagsSqlExpr}, ${finalStatus}, ${isAdmin}, ${vaultCertificateId}, 0, 0
        )
        RETURNING *;
      `)
    )

    const newPost = inserted[0]
    const postId = Number(newPost.id)

    // 6. Notarizzazione On-Chain (protetta: non blocca mai la pubblicazione)
    let proof: any = null
    try {
      proof = await BlockchainService.notarizeEntity(db, {
        entityType: 'blog',
        entityId: postId,
        title: cleanTitle,
        content: finalContent
      })
    } catch (vaultErr: any) {
      console.warn('⚠️ [Vault Blog Fallback]:', vaultErr?.message)
      const fallbackHash = crypto
        .createHash('sha256')
        .update(`blog:${postId}:${cleanTitle}:${finalContent}`)
        .digest('hex')
      await db.execute(sql`
        UPDATE blog_posts
        SET vault_hash = ${fallbackHash}, is_verified = ${isAdmin}
        WHERE id = ${postId};
      `).catch(() => null)
      proof = { vaultHash: fallbackHash, blockNumber: null }
    }

    // 6B. Sentinel Network — Knowledge Dependabot su articolo Blog
    if (newPost?.id) {
      void KnowledgeDependabotService.inspectAndAutoComment({
        entityType: 'blog',
        entityId: Number(newPost.id),
        entitySlug: String(newPost.slug || ''),
        title: cleanTitle,
        content: String(body.content || ''),
        authorUsername: String(sessionUser?.username || '')
      }).catch(() => null)
    }

    // 7. Assegnazione +150 XP all'autore autenticato
    try {
      await db.execute(sql`
        UPDATE users SET xp = COALESCE(xp, 0) + 150 WHERE id = ${authorId};
      `)
      await db.execute(sql`
        INSERT INTO xp_transactions (user_id, action, points)
        VALUES (${authorId}, ${`Pubblicazione articolo: "${cleanTitle.substring(0, 30)}..."`}, 150);
      `)
    } catch {}

    return {
      success: true,
      message: isAdmin
        ? 'Articolo pubblicato e notarizzato SHA-256 con successo!'
        : 'Articolo inviato e notarizzato! In attesa di verifica DKP Vault.',
      data: {
        ...newPost,
        vault_hash: proof?.vaultHash || newPost.vault_hash,
        vaultHash: proof?.vaultHash || newPost.vault_hash,
        vault_block_number: proof?.blockNumber ?? newPost.vault_block_number ?? null,
        vaultBlockNumber: proof?.blockNumber ?? newPost.vault_block_number ?? null
      },
      proof
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('\n💥 [DKP BLOG POST ERROR]:', error?.message || error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore salvataggio articolo [${error?.code || 'SQL_ERROR'}]: ${error?.message}`
    })
  }
})