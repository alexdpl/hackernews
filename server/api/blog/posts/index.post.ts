import crypto from 'node:crypto'
import postgres from 'postgres'

function slugify(text: string): string {
  return text.toString().toLowerCase().trim().replace(/[\s\W_]+/g, '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  if (event.node?.req?.headers && typeof (event.node.req.headers as any).get !== 'function') {
    (event.node.req.headers as any).get = (key: string) => (event.node.req.headers as any)[key.toLowerCase()]
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

  // Configurazione SSL flessibile per Cloud Run / Neon / Supabase
  const isProd = process.env.NODE_ENV === 'production'
  const sql = postgres(connectionString, { 
    ssl: isProd ? { rejectUnauthorized: false } : 'prefer' 
  })

  try {
    // 1. Gestione Categoria
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
        await sql.end()
        throw createError({ statusCode: 400, statusMessage: 'Nessuna categoria disponibile nel DB.' })
      }
    }

    // 2. Gestione Sottocategoria
    let finalSubcategoryId = subcategoryId ? Number(subcategoryId) : null
    if (!finalSubcategoryId && subCategory) {
      const foundSub = await sql`SELECT id FROM blog_subcategories WHERE name ILIKE ${subCategory} LIMIT 1`
      if (foundSub.length > 0) {
        finalSubcategoryId = foundSub[0].id
      }
    }

    // 3. Verifica ed estrazione ID Autore reale
    let authorId: number | null = null
    try {
      const usersList = await sql`SELECT id FROM users ORDER BY id ASC LIMIT 1`
      if (usersList.length > 0) {
        authorId = usersList[0].id
      }
    } catch (e) {
      console.warn("⚠️ Impossibile interrogare la tabella users.")
    }

    if (!authorId) {
      await sql.end()
      throw createError({ statusCode: 400, statusMessage: 'Nessun utente trovato nel DB per essere associato come autore.' })
    }

    // 4. Generazione Hash e Certificato Vault
    const finalVaultHash = reqVaultHash || crypto.createHash('sha256').update(`dkp-direct-${Date.now()}-${generatedSlug}`).digest('hex')
    const certSuffix = (
      crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + 'AAAAAA'
    ).slice(0, 6)
    const vaultCertificateId = reqVaultHash ? `DKP-VAULT-CERT-VERIFIED-${certSuffix}` : `DKP-VAULT-CERT-ADMIN-${certSuffix}`

    const finalStatus = status || 'published'
    const finalExcerpt = excerpt || summary || null
    const finalContent = content || finalExcerpt || 'Contenuto non disponibile.'

    // 5. Inserimento Post (Passando l'array direttamente per supportare text[])
    const [newPost] = await sql`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, category_id, subcategory_id, author_id, tags, status, is_verified, vault_certificate_id, vault_hash, views, likes
      ) VALUES (
        ${cleanTitle}, ${generatedSlug}, ${finalContent}, ${finalExcerpt}, ${finalCategoryId}, ${finalSubcategoryId}, ${authorId}, ${cleanTags}, ${finalStatus}, true, ${vaultCertificateId}, ${finalVaultHash}, 0, 0
      )
      RETURNING *;
    `

    // 6. Assegnazione XP protetta (Un errore sugli XP non blocca la pubblicazione dell'articolo)
    try {
      await sql`
        UPDATE users 
        SET xp = COALESCE(xp, 0) + 150 
        WHERE id = ${authorId}
      `

      await sql`
        INSERT INTO xp_transactions (user_id, action, points) 
        VALUES (${authorId}, ${`Pubblicazione articolo: "${cleanTitle.substring(0, 30)}..."`}, 150)
      `
    } catch (xpError: any) {
      console.warn("⚠️ Warning XP non assegnati:", xpError.message)
    }

    await sql.end()

    return {
      success: true,
      message: 'Articolo pubblicato con successo!',
      data: newPost,
    }
  } catch (error: any) {
    await sql.end()
    console.error("\n💥 [DKP VAULT ERROR] ERRORE INSERIMENTO POST:", error.message || error)

    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Un articolo con questo titolo o slug esiste già.' })
    }

    throw createError({ 
      statusCode: 500, 
      statusMessage: `Errore DB [${error.code || 'SQL_ERROR'}]: ${error.message}` 
    })
  }
})