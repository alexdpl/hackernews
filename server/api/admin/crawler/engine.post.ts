// server/api/admin/crawler/engine.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { targetUrl, licenseKey, sourceConfig } = body

  if (!targetUrl || !licenseKey) {
    throw createError({ statusCode: 400, statusMessage: 'Target URL e License Key obbligatori' })
  }

  const db = getDb()
  const startTime = Date.now()

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

  try {
    // 2. SIMULAZIONE MOTORE DI SCRAPING (Da implementare con Cheerio/Puppeteer)
    const simulatedItemsScraped = Math.floor(Math.random() * 15) + 1
    const executionTime = Date.now() - startTime

    // 3. Aggiornamento Metriche SaaS e Log
    await db.execute(sql`
      UPDATE dkp_crawler_licenses 
      SET requests_used = requests_used + 1 
      WHERE id = ${license.id};
    `)

    await db.execute(sql`
      INSERT INTO dkp_crawler_logs (license_id, target_url, items_scraped, status, execution_time_ms)
      VALUES (${license.id}, ${targetUrl}, ${simulatedItemsScraped}, 'success', ${executionTime});
    `)

    return {
      success: true,
      message: 'Scraping completato con successo',
      data: {
        itemsFound: simulatedItemsScraped,
        timeMs: executionTime,
        usage: `${license.requests_used + 1}/${license.requests_limit}`
      }
    }
  } catch (err: any) {
    // Log del fallimento
    await db.execute(sql`
      INSERT INTO dkp_crawler_logs (license_id, target_url, status)
      VALUES (${license.id}, ${targetUrl}, 'failed');
    `)
    throw createError({ statusCode: 500, statusMessage: 'Errore interno del motore Crawler' })
  }
})