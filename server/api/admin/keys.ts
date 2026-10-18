// server/api/admin/keys.ts
import { defineEventHandler, readBody, createError, getMethod, setResponseHeaders } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses, dkpCrawlerLicenses } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = getDb()

  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'X-DKP-Version': 'v2.5-GOLD'
  })

  // 1. GET: Recupera sia le licenze dello Shop che le chiavi API del Gateway
  if (method === 'GET') {
    try {
      const shopLicenses = await db
        .select()
        .from(licenses)
        .orderBy(desc(licenses.createdAt))

      const apiGatewayKeys = await db
        .select()
        .from(dkpCrawlerLicenses)
        .orderBy(desc(dkpCrawlerLicenses.createdAt))

      const formattedShop = shopLicenses.map(l => ({
        id: `shop_${l.id}`,
        rawId: l.id,
        source: 'SHOP',
        email: l.customerEmail || 'Client Shop',
        licenseKey: l.licenseKey,
        role: l.productId || 'Shop License',
        downloadsCount: l.downloadsCount,
        maxDownloads: l.maxDownloads,
        usage: `${l.downloadsCount} / ${l.maxDownloads} dls`,
        status: l.status ? l.status.toUpperCase() : 'ACTIVE',
        joined: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : '2026-10-18'
      }))

      const formattedApi = apiGatewayKeys.map(k => ({
        id: `api_${k.id}`,
        rawId: k.id,
        source: 'API GATEWAY',
        email: `User ID #${k.userId}`,
        licenseKey: k.licenseKey,
        role: k.tier ? k.tier.toUpperCase() : 'API KEY',
        downloadsCount: k.requestsUsed || 0,
        maxDownloads: k.requestsLimit || 1000,
        usage: `${k.requestsUsed || 0} / ${k.requestsLimit || 1000} req`,
        status: k.isActive ? 'ACTIVE' : 'SUSPENDED',
        joined: k.createdAt ? new Date(k.createdAt).toISOString().split('T')[0] : '2026-10-18'
      }))

      return { 
        success: true, 
        version: 'v2.5-GOLD',
        region: 'europe-west4',
        data: [...formattedShop, ...formattedApi]
      }
    } catch (error: any) {
      console.error('❌ Errore recupero chiavi unificate:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Errore server recupero chiavi: ${error.message}`
      })
    }
  }

  // 2. POST: Gestisce Sospendi/Riattiva sia per Shop che per API Gateway
  if (method === 'POST') {
    try {
      const body = (await readBody(event)) || {}
      const { id, status } = body

      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID chiave/licenza mancante.' })
      }

      const strId = String(id)

      if (strId.startsWith('shop_')) {
        const rawId = strId.replace('shop_', '')
        const newStatus = status === 'ACTIVE' ? 'active' : 'suspended'
        await db
          .update(licenses)
          .set({ status: newStatus as any })
          .where(eq(licenses.id, rawId))

        return { success: true, message: `Stato licenza Shop aggiornato in: ${status}` }
      } else if (strId.startsWith('api_')) {
        const rawId = Number(strId.replace('api_', ''))
        const isActive = status === 'ACTIVE'
        await db
          .update(dkpCrawlerLicenses)
          .set({ isActive })
          .where(eq(dkpCrawlerLicenses.id, rawId))

        return { success: true, message: `Stato API Key Gateway aggiornato in: ${status}` }
      } else {
        const numId = Number(id)
        if (!isNaN(numId)) {
          await db
            .update(dkpCrawlerLicenses)
            .set({ isActive: status === 'ACTIVE' })
            .where(eq(dkpCrawlerLicenses.id, numId))
        }
        return { success: true, message: `Stato chiave aggiornato in: ${status}` }
      }
    } catch (error: any) {
      console.error('❌ Errore modifica stato chiave:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Errore durante l'aggiornamento: ${error.message}`
      })
    }
  }
})