// server/api/blog/posts/index.post.ts
import crypto from 'node:crypto'
import postgres from 'postgres'

function slugify(text: string): string {
  return text.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  if (event.node?.req?.headers && typeof (event.node.req.headers as any).get !== 'function') {
    (event.node.req.headers as any).get = (key: string) => (event.node.req.headers as any)[key.toLowerCase()]
  }
  if (event.req?.headers && typeof (event.req.headers as any).get !== 'function') {
    (event.req.headers as any).get = (key: string) => (event.req.headers as any)[key.toLowerCase()]
  }

  let body: any = {}
  try {
    body = await readBody(event) || {}
  } catch (error) {
    console.error("Errore lettura body:", error)
    throw createError({ statusCode: 400, statusMessage: 'Payload della richiesta non valido.' })
  }
  
  const { 
    title, 
    categoryId, category, 
    subcategoryId, subCategory, 
    excerpt, summary, 
    content, 
    tags, 
    vaultHash: reqVaultHash, 
    sastStatus, 
    status 
  } = body

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio.' })
  }

  const generatedSlug = slugify(cleanTitle)
  
  let cleanTags: string[] = []
  if (Array.isArray(tags)) {
    cleanTags = tags.map(t => String(t).trim().replace(/^#/, '')).filter(Boolean)
  } else if (typeof tags === 'string') {
    cleanTags = tags.split(/[,;]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL mancante nelle variabili d\'ambiente.' })
  }

  const sql = postgres(connectionString, { ssl: 'require' })

  try {
    let finalCategoryId = categoryId ? Number(categoryId) : null

    if (!finalCategoryId && category) {
      const foundCat = await sql`SELECT id FROM blog_categories WHERE name ILIKE ${category} OR slug ILIKE ${slugify(category)} LIMIT 1`
      if (foundCat.length > 0) {
        finalCategoryId = foundCat[0].id
      }
    }

    if (!finalCategoryId) {
      const defaultCat = await sql`SELECT id FROM blog_categories LIMIT 1`
      if (defaultCat.length > 0) {
        finalCategoryId = defaultCat[0].id
      } else {
        throw createError({ statusCode: 400, statusMessage: 'Nessuna categoria disponibile nel DB.' })
      }
    }

    let finalSubcategoryId = subcategoryId ? Number(subcategoryId) : null
    if (!finalSubcategoryId && subCategory) {
      const foundSub = await sql`SELECT id FROM blog_subcategories WHERE name ILIKE ${subCategory} LIMIT 1`
      if (foundSub.length > 0) {
        finalSubcategoryId = foundSub[0].id
      }
    }

    let authorId = 1
    try {
      const usersList = await sql`SELECT id FROM users LIMIT 1`
      if (usersList.length > 0) {
        authorId = usersList[0].id
      }
    } catch (e) {
      console.warn("Tabella users non accessibile, uso fallback autore 1.")
    }

    const finalVaultHash = reqVaultHash || crypto.createHash('sha256').update(`dkp-direct-${Date.now()}-${generatedSlug}`).digest('hex')
    const vaultCertificateId = reqVaultHash ? `DKP-VAULT-CERT-VERIFIED-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : `DKP-VAULT-CERT-ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    const finalStatus = status || 'published' 
    const finalExcerpt = excerpt || summary || null
    const finalContent = content || finalExcerpt || 'Contenuto non disponibile.'

    const [newPost] = await sql`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, category_id, subcategory_id, author_id, tags, status, is_verified, vault_certificate_id, vault_hash, views, likes
      ) VALUES (
        ${cleanTitle}, ${generatedSlug}, ${finalContent}, ${finalExcerpt}, ${finalCategoryId}, ${finalSubcategoryId}, ${authorId}, ${sql.json(cleanTags)}, ${finalStatus}, true, ${vaultCertificateId}, ${finalVaultHash}, 0, 0
      )
      RETURNING *;
    `

    // 🟢 AGGIUNTA XP AUTOMATICI PER LA PUBBLICAZIONE (+150 XP)
    await sql`
      UPDATE users 
      SET xp = COALESCE(xp, 0) + 150 
      WHERE id = ${authorId}
    `

    await sql`
      INSERT INTO xp_transactions (user_id, action, points) 
      VALUES (${authorId}, ${`Pubblicazione articolo: "${cleanTitle.substring(0, 30)}..."`}, 150)
    `

    await sql.end()

    return {
      success: true,
      message: 'Articolo pubblicato, salvato nel DB e +150 XP assegnati!',
      data: newPost,
    }
  } catch (error: any) {
    await sql.end()
    console.error("\n💥 [DKP VAULT ERROR] ERRORE INSERIMENTO POST:", error.message)
    
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Un articolo con questo titolo o slug esiste già.' })
    }
    
    throw createError({ statusCode: 500, statusMessage: `Errore DB: ${error.message}` })
  }
})