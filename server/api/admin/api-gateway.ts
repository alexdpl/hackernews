// server/api/admin/api-gateway.ts
import { desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys, licenses } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  try {
    const db = getDb()
    if (!db) {
      return { success: true, data: [], message: 'Database non disponibile' }
    }

    if (method === 'GET') {
      let apiKeyRows: any[] = []
      let licenseRows: any[] = []

      // 1. Recuperiamo le API Keys create dagli utenti (la tabella principale che usi nella dashboard)
      try {
        apiKeyRows = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt))
      } catch (e) {
        console.warn('⚠️ Tabella apiKeys non ancora inizializzata o vuota')
      }

      // 2. Recuperiamo eventuali licenze commerciali
      try {
        licenseRows = await db.select().from(licenses).orderBy(desc(licenses.createdAt))
      } catch (e) {
        // Ignora se la tabella licenses non esiste
      }

      // Mappatura pulita per il frontend admin
      const mappedApiKeys = apiKeyRows.map((r: any) => ({
        id: `key_${r.id}`,
        realId: r.id,
        type: 'apikey',
        userId: r.userId || null,
        customerEmail: `utente-id-${r.userId || 'guest'}@devkernelpulse.com`,
        productName: `API Key: ${r.name || 'Generica'} [${r.role || 'PRO'}]`,
        licenseKey: r.keyPrefix ? `${r.keyPrefix}...` : 'dkp_live_...',
        status: (r.status || 'ACTIVE').toLowerCase(),
        downloadsCount: r.usageCount || 0,
        maxDownloads: 10000, // Quota predefinita per le API Key
        createdAt: r.createdAt
      }))

      const mappedLicenses = licenseRows.map((r: any) => ({
        id: `lic_${r.id}`,
        realId: r.id,
        type: 'license',
        userId: r.userId || null,
        customerEmail: r.customerEmail || 'cliente@devkernelpulse.com',
        productName: `Licenza: ${r.productName || 'Core Suite'}`,
        licenseKey: r.licenseKey || 'dkp_lic_...',
        status: (r.status || 'active').toLowerCase(),
        downloadsCount: r.downloadsCount || 0,
        maxDownloads: r.maxDownloads || 10,
        createdAt: r.createdAt
      }))

      return { 
        success: true, 
        data: [...mappedApiKeys, ...mappedLicenses] 
      }
    }

    return { success: true, message: 'OK' }

  } catch (error: any) {
    console.error('❌ Errore critico Admin API Gateway:', error)
    return { success: true, data: [], error: error.message }
  }
})