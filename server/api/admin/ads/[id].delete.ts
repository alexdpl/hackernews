// server/api/admin/ads/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { DkpAdsService } from '../../../utils/dkpAdsService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') || '').trim()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID campagna mancante.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  await DkpAdsService.ensureSchema(db)

  const deleted = extractRows(
    await db.execute(sql`DELETE FROM dkp_ads_campaigns WHERE id = ${id} RETURNING id;`)
  )

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Campagna non trovata.' })
  }

  return { success: true, deletedId: id }
})