import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const action = String(body?.action || 'save')
  const db = await Promise.resolve(getDb())
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  const tablesRes = await db.execute(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('blog_posts', 'blog_categories', 'dkp_blog_posts');
  `)
  const existing = new Set(extractRows(tablesRes).map((r: any) => String(r.table_name)))
  const targetTable = existing.has('blog_posts') ? 'blog_posts' : 'dkp_blog_posts'

  const colsRes = await db.execute(sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${targetTable};
  `)
  const colRows = extractRows(colsRes)
  const cols = new Set(colRows.map((c: any) => String(c.column_name)))
  const tagsColType = colRows.find((c: any) => c.column_name === 'tags')?.data_type || 'text'

  if (action === 'save') {
    const id = body?.id ? Number(body.id) : null
    const title = String(body?.title || '').trim()
    if (!title) throw createError({ statusCode: 400, statusMessage: 'Titolo articolo obbligatorio' })

    const slug = makeSlug(String(body?.slug || title)) || `post-${Date.now()}`
    const category = String(body?.category || 'Architecture').trim()
    const subCategory = String(body?.subCategory || '').trim()
    const excerpt = String(body?.excerpt ?? body?.summary ?? '').trim()
    const content = String(body?.content || '').trim()
    const coverImage = String(body?.coverImage || '').trim()
    const author = String(body?.author || 'DKP Editorial').trim()
    const tagsArray = Array.isArray(body?.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : String(body?.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean)
    const tagsCsv = tagsArray.join(', ')
    const status = body?.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
    const isFeatured = Boolean(body?.isFeatured)

    if (targetTable === 'blog_posts') {
      let targetId = id
      if (targetId) {
        await db.execute(sql`
          UPDATE blog_posts
          SET title = ${title}, slug = ${slug}, content = ${content}
          WHERE id = ${targetId};
        `)
      } else {
        const insRes = await db.execute(sql`
          INSERT INTO blog_posts (title, slug, content)
          VALUES (${title}, ${slug}, ${content})
          RETURNING id;
        `)
        targetId = Number(extractRows(insRes)[0]?.id)
      }

      if (targetId) {
        if (cols.has('category')) await db.execute(sql`UPDATE blog_posts SET category = ${category} WHERE id = ${targetId};`)
        if (cols.has('category_name')) await db.execute(sql`UPDATE blog_posts SET category_name = ${category} WHERE id = ${targetId};`)
        if (cols.has('category_id') && existing.has('blog_categories')) {
          const catRes = await db.execute(sql`SELECT id FROM blog_categories WHERE LOWER(name) = LOWER(${category}) LIMIT 1;`).catch(() => null)
          const catId = Number(extractRows(catRes)[0]?.id || 0)
          if (catId > 0) {
            await db.execute(sql`UPDATE blog_posts SET category_id = ${catId} WHERE id = ${targetId};`)
          }
        }
        if (cols.has('sub_category')) await db.execute(sql`UPDATE blog_posts SET sub_category = ${subCategory} WHERE id = ${targetId};`)
        if (cols.has('subcategory')) await db.execute(sql`UPDATE blog_posts SET subcategory = ${subCategory} WHERE id = ${targetId};`)
        if (cols.has('excerpt')) await db.execute(sql`UPDATE blog_posts SET excerpt = ${excerpt} WHERE id = ${targetId};`)
        if (cols.has('summary')) await db.execute(sql`UPDATE blog_posts SET summary = ${excerpt} WHERE id = ${targetId};`)
        if (cols.has('cover_image')) await db.execute(sql`UPDATE blog_posts SET cover_image = ${coverImage} WHERE id = ${targetId};`)
        if (cols.has('image_url')) await db.execute(sql`UPDATE blog_posts SET image_url = ${coverImage} WHERE id = ${targetId};`)
        if (cols.has('author')) await db.execute(sql`UPDATE blog_posts SET author = ${author} WHERE id = ${targetId};`)
        if (cols.has('status')) await db.execute(sql`UPDATE blog_posts SET status = ${status} WHERE id = ${targetId};`)
        if (cols.has('is_published')) await db.execute(sql`UPDATE blog_posts SET is_published = ${status === 'PUBLISHED'} WHERE id = ${targetId};`)
        if (cols.has('is_featured')) await db.execute(sql`UPDATE blog_posts SET is_featured = ${isFeatured} WHERE id = ${targetId};`)
        if (cols.has('tags')) {
          if (tagsColType === 'ARRAY') {
            await db.execute(sql`UPDATE blog_posts SET tags = ${tagsArray} WHERE id = ${targetId};`)
          } else {
            await db.execute(sql`UPDATE blog_posts SET tags = ${tagsCsv} WHERE id = ${targetId};`)
          }
        }
      }
      return { success: true, message: id ? `Articolo #${id} aggiornato!` : 'Nuovo articolo pubblicato!' }
    }

    if (id) {
      await db.execute(sql`
        UPDATE dkp_blog_posts
        SET title = ${title}, slug = ${slug}, category = ${category}, sub_category = ${subCategory},
            excerpt = ${excerpt}, content = ${content}, cover_image = ${coverImage}, author = ${author},
            tags = ${tagsCsv}, status = ${status}, is_featured = ${isFeatured}
        WHERE id = ${id};
      `)
    } else {
      await db.execute(sql`
        INSERT INTO dkp_blog_posts (title, slug, category, sub_category, excerpt, content, cover_image, author, tags, status, is_featured)
        VALUES (${title}, ${slug}, ${category}, ${subCategory}, ${excerpt}, ${content}, ${coverImage}, ${author}, ${tagsCsv}, ${status}, ${isFeatured});
      `)
    }
    return { success: true, message: id ? `Articolo #${id} aggiornato!` : 'Nuovo articolo pubblicato!' }
  }

  const id = Number(body?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID articolo non valido' })

  if (action === 'toggle_status') {
    if (targetTable === 'blog_posts') {
      if (cols.has('status')) {
        await db.execute(sql`UPDATE blog_posts SET status = CASE WHEN UPPER(COALESCE(status,'PUBLISHED')) = 'PUBLISHED' THEN 'DRAFT' ELSE 'PUBLISHED' END WHERE id = ${id};`)
      }
      if (cols.has('is_published')) {
        await db.execute(sql`UPDATE blog_posts SET is_published = NOT COALESCE(is_published, TRUE) WHERE id = ${id};`)
      }
    } else {
      await db.execute(sql`UPDATE dkp_blog_posts SET status = CASE WHEN status = 'PUBLISHED' THEN 'DRAFT' ELSE 'PUBLISHED' END WHERE id = ${id};`)
    }
    return { success: true, message: `Stato pubblicazione articolo #${id} aggiornato.` }
  }

  if (action === 'toggle_featured') {
    if (targetTable === 'blog_posts' && cols.has('is_featured')) {
      await db.execute(sql`UPDATE blog_posts SET is_featured = NOT COALESCE(is_featured, FALSE) WHERE id = ${id};`)
    } else if (targetTable === 'dkp_blog_posts') {
      await db.execute(sql`UPDATE dkp_blog_posts SET is_featured = NOT COALESCE(is_featured, FALSE) WHERE id = ${id};`)
    }
    return { success: true, message: `Flag In Evidenza articolo #${id} aggiornato.` }
  }

  if (action === 'delete') {
    if (targetTable === 'blog_posts') {
      await db.execute(sql`DELETE FROM blog_posts WHERE id = ${id};`)
    } else {
      await db.execute(sql`DELETE FROM dkp_blog_posts WHERE id = ${id};`)
    }
    return { success: true, message: `Articolo #${id} eliminato definitivamente.` }
  }

  throw createError({ statusCode: 400, statusMessage: 'Azione non supportata' })
})