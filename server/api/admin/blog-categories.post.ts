import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function toSlug(val: string): string {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function getTableColumns(db: any, tableName: string): Promise<Set<string>> {
  const res = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName};
  `)
  return new Set(extractRows(res).map((r: any) => String(r.column_name)))
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const action = String(body?.action || 'list')
  const db = await Promise.resolve(getDb())
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_blog_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) UNIQUE NOT NULL,
      slug VARCHAR(120) UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      subcategories JSONB DEFAULT '[]'::jsonb,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  const tablesRes = await db.execute(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('blog_posts', 'blog_categories');
  `)
  const existingTables = new Set(extractRows(tablesRes).map((r: any) => String(r.table_name)))

  const loadCategories = async () => {
    const res = await db.execute(sql`SELECT * FROM dkp_blog_categories ORDER BY sort_order ASC, id ASC;`)
    return extractRows(res).map((r: any) => ({
      id: Number(r.id),
      name: String(r.name),
      slug: String(r.slug),
      description: String(r.description || ''),
      subcategories: Array.isArray(r.subcategories)
        ? r.subcategories.map((s: any) => (typeof s === 'string' ? s : String(s?.name || '')))
        : []
    }))
  }

  if (action === 'list') {
    let cats = await loadCategories()
    if (cats.length === 0) {
      const seedMap = new Map<string, { description: string; subs: string[] }>()

      // 1. Se esiste blog_categories nel DB, importa tutte le categorie e sottocategorie esistenti
      if (existingTables.has('blog_categories')) {
        const bcCols = await getTableColumns(db, 'blog_categories')
        const bcRes = await db.execute(sql`SELECT * FROM blog_categories ORDER BY id ASC;`)
        const bcRows = extractRows(bcRes)

        if (bcCols.has('parent_id')) {
          const roots = bcRows.filter((r: any) => !r.parent_id)
          const children = bcRows.filter((r: any) => Boolean(r.parent_id))
          for (const root of roots) {
            const rName = String(root.name || root.title || '').trim()
            if (!rName) continue
            const subList = children
              .filter((ch: any) => Number(ch.parent_id) === Number(root.id))
              .map((ch: any) => String(ch.name || ch.title || '').trim())
              .filter(Boolean)
            seedMap.set(rName, {
              description: String(root.description || ''),
              subs: subList
            })
          }
        } else {
          for (const row of bcRows) {
            const rName = String(row.name || row.title || '').trim()
            if (!rName) continue
            const subs = Array.isArray(row.subcategories) ? row.subcategories.map(String) : []
            seedMap.set(rName, {
              description: String(row.description || ''),
              subs
            })
          }
        }
      }

      // 2. Se esiste blog_posts, controlla in modo sicuro quali colonne possiede davvero
      if (existingTables.has('blog_posts')) {
        const postCols = await getTableColumns(db, 'blog_posts')
        if (postCols.has('category')) {
          const pCats = await db.execute(sql`SELECT DISTINCT category FROM blog_posts WHERE category IS NOT NULL AND category <> '';`)
          extractRows(pCats).forEach((r: any) => {
            const n = String(r.category).trim()
            if (n && !seedMap.has(n)) seedMap.set(n, { description: '', subs: [] })
          })
        } else if (postCols.has('category_name')) {
          const pCats = await db.execute(sql`SELECT DISTINCT category_name FROM blog_posts WHERE category_name IS NOT NULL AND category_name <> '';`)
          extractRows(pCats).forEach((r: any) => {
            const n = String(r.category_name).trim()
            if (n && !seedMap.has(n)) seedMap.set(n, { description: '', subs: [] })
          })
        }
      }

      // 3. Fallback iniziale se il DB e' ancora vuoto
      if (seedMap.size === 0) {
        for (const fallback of ['Architecture', 'Security & SAST', 'Pure SQL & DB', 'AI & Agents', 'DevOps & Edge']) {
          seedMap.set(fallback, { description: '', subs: [] })
        }
      }

      for (const [name, meta] of seedMap.entries()) {
        const slug = toSlug(name) || `cat-${Date.now()}`
        await db.execute(sql`
          INSERT INTO dkp_blog_categories (name, slug, description, subcategories)
          VALUES (${name}, ${slug}, ${meta.description}, ${JSON.stringify(meta.subs)}::jsonb)
          ON CONFLICT (name) DO NOTHING;
        `)
      }
      cats = await loadCategories()
    }
    return { success: true, categories: cats }
  }

  if (action === 'create_category') {
    const name = String(body?.name || '').trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Nome categoria obbligatorio' })
    const slug = toSlug(String(body?.slug || name)) || `cat-${Date.now()}`
    const description = String(body?.description || '').trim()
    const subs = Array.isArray(body?.subcategories)
      ? body.subcategories.map((s: any) => String(s).trim()).filter(Boolean)
      : []

    await db.execute(sql`
      INSERT INTO dkp_blog_categories (name, slug, description, subcategories)
      VALUES (${name}, ${slug}, ${description}, ${JSON.stringify(subs)}::jsonb)
      ON CONFLICT (name) DO UPDATE
      SET description = EXCLUDED.description, subcategories = EXCLUDED.subcategories;
    `)

    if (existingTables.has('blog_categories')) {
      const bcCols = await getTableColumns(db, 'blog_categories')
      if (bcCols.has('name') && bcCols.has('slug')) {
        await db.execute(sql`
          INSERT INTO blog_categories (name, slug)
          VALUES (${name}, ${slug})
          ON CONFLICT (slug) DO NOTHING;
        `).catch(() => {})
      }
    }

    return { success: true, message: `Categoria "${name}" salvata!`, categories: await loadCategories() }
  }

  if (action === 'update_category') {
    const id = Number(body?.id)
    const name = String(body?.name || '').trim()
    const oldName = String(body?.oldName || '').trim()
    if (!id || !name) throw createError({ statusCode: 400, statusMessage: 'Dati categoria non validi' })
    const slug = toSlug(String(body?.slug || name))
    const description = String(body?.description || '').trim()

    await db.execute(sql`
      UPDATE dkp_blog_categories
      SET name = ${name}, slug = ${slug}, description = ${description}
      WHERE id = ${id};
    `)

    if (oldName && oldName !== name && existingTables.has('blog_posts')) {
      const postCols = await getTableColumns(db, 'blog_posts')
      if (postCols.has('category')) {
        await db.execute(sql`UPDATE blog_posts SET category = ${name} WHERE category = ${oldName};`)
      } else if (postCols.has('category_name')) {
        await db.execute(sql`UPDATE blog_posts SET category_name = ${name} WHERE category_name = ${oldName};`)
      }
    }
    return { success: true, message: `Categoria aggiornata in "${name}"!`, categories: await loadCategories() }
  }

  if (action === 'delete_category') {
    const id = Number(body?.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID categoria mancante' })
    await db.execute(sql`DELETE FROM dkp_blog_categories WHERE id = ${id};`)
    return { success: true, message: 'Categoria eliminata.', categories: await loadCategories() }
  }

  if (action === 'add_subcategory') {
    const categoryId = Number(body?.categoryId)
    const subName = String(body?.subName || '').trim()
    if (!categoryId || !subName) throw createError({ statusCode: 400, statusMessage: 'Seleziona categoria e nome sottocategoria' })

    const currentRes = await db.execute(sql`SELECT subcategories FROM dkp_blog_categories WHERE id = ${categoryId} LIMIT 1;`)
    const row = extractRows(currentRes)[0]
    const list: string[] = Array.isArray(row?.subcategories) ? row.subcategories.map(String) : []
    if (!list.includes(subName)) list.push(subName)

    await db.execute(sql`
      UPDATE dkp_blog_categories SET subcategories = ${JSON.stringify(list)}::jsonb WHERE id = ${categoryId};
    `)
    return { success: true, message: `Sottocategoria "${subName}" aggiunta!`, categories: await loadCategories() }
  }

  if (action === 'rename_subcategory') {
    const categoryId = Number(body?.categoryId)
    const oldSub = String(body?.oldSub || '').trim()
    const newSub = String(body?.newSub || '').trim()
    if (!categoryId || !oldSub || !newSub) throw createError({ statusCode: 400, statusMessage: 'Dati sottocategoria non validi' })

    const currentRes = await db.execute(sql`SELECT subcategories FROM dkp_blog_categories WHERE id = ${categoryId} LIMIT 1;`)
    const row = extractRows(currentRes)[0]
    const list: string[] = Array.isArray(row?.subcategories) ? row.subcategories.map(String) : []
    const updated = list.map(s => (s === oldSub ? newSub : s))

    await db.execute(sql`
      UPDATE dkp_blog_categories SET subcategories = ${JSON.stringify(updated)}::jsonb WHERE id = ${categoryId};
    `)
    return { success: true, message: `Sottocategoria rinominata in "${newSub}"!`, categories: await loadCategories() }
  }

  if (action === 'delete_subcategory') {
    const categoryId = Number(body?.categoryId)
    const subName = String(body?.subName || '').trim()
    if (!categoryId || !subName) throw createError({ statusCode: 400, statusMessage: 'Dati sottocategoria mancanti' })

    const currentRes = await db.execute(sql`SELECT subcategories FROM dkp_blog_categories WHERE id = ${categoryId} LIMIT 1;`)
    const row = extractRows(currentRes)[0]
    const list: string[] = Array.isArray(row?.subcategories) ? row.subcategories.map(String) : []
    const filtered = list.filter(s => s !== subName)

    await db.execute(sql`
      UPDATE dkp_blog_categories SET subcategories = ${JSON.stringify(filtered)}::jsonb WHERE id = ${categoryId};
    `)
    return { success: true, message: `Sottocategoria "${subName}" rimossa.`, categories: await loadCategories() }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non valida' })
})