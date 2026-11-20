import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

  await db.execute(sql`
    UPDATE dkp_seo_settings
    SET
      site_title = ${String(body?.siteTitle || '')},
      meta_description = ${String(body?.metaDescription || '')},
      og_image = ${String(body?.ogImage || '')},
      robots_policy = ${String(body?.robotsPolicy || 'index, follow')},
      canonical_base = ${String(body?.canonicalBase || 'https://devkernelpulse.org')},
      updated_at = NOW()
    WHERE id = 1;
  `)

  return { success: true, message: 'Configurazione SEO & Meta Tags salvata su Neon Pure SQL!' }
})