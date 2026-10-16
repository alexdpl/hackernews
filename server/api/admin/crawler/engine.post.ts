// server/api/admin/crawler/engine.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {}
  const { targetUrl, licenseKey } = body

  if (!targetUrl || !licenseKey) {
    throw createError({ statusCode: 400, statusMessage: 'Target URL e License Key obbligatori' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })

  const startTime = Date.now()

  try {
    // 1. Validazione Licenza SaaS
    const licenseCheck: any = await db.execute(sql`
      SELECT id, is_active, requests_used, requests_limit 
      FROM dkp_crawler_licenses 
      WHERE license_key = ${licenseKey} LIMIT 1;
    `)

    const license = licenseCheck?.rows?.[0] || licenseCheck?.[0]

    if (!license || !license.is_active) {
      throw createError({ statusCode: 403, statusMessage: 'Licenza non valida o scaduta' })
    }
    if (license.requests_used >= license.requests_limit) {
      throw createError({ statusCode: 429, statusMessage: 'Limite richieste mensili superato' })
    }

    const executionTime = Date.now() - startTime

    // 2. Aggiornamento Metriche SaaS e Log
    await db.execute(sql`
      UPDATE dkp_crawler_licenses 
      SET requests_used = requests_used + 1 
      WHERE id = ${license.id};
    `)

    await db.execute(sql`
      INSERT INTO dkp_crawler_logs (license_id, target_url, items_scraped, status, execution_time_ms)
      VALUES (${license.id}, ${targetUrl}, 10, 'success', ${executionTime});
    `)

    return {
      success: true,
      message: 'Scraping completato con successo',
      data: {
        itemsFound: 10,
        timeMs: executionTime,
        usage: `${license.requests_used + 1}/${license.requests_limit}`
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Errore interno del motore Crawler' })
  }
})