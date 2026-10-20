// server/api/admin/keys.ts
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys, licenses, users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = getDb()
  
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'X-DKP-Version': 'v2.5-GOLD'
  })

  // 1. GET: Recupero unificato delle API Keys commerciali e delle Licenze dal DB Neon
  if (method === 'GET') {
    try {
      // Recupero chiavi dall'API Gateway
      const gatewayKeys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyMasked: apiKeys.keyMasked,
          keyPrefix: apiKeys.keyPrefix,
          role: apiKeys.role,
          status: apiKeys.status,
          usageCount: apiKeys.usageCount,
          createdAt: apiKeys.createdAt,
          userEmail: users.email
        })
        .from(apiKeys)
        .leftJoin(users, eq(apiKeys.userId, users.id))
        .orderBy(desc(apiKeys.createdAt))

      // Mappatura per il pannello Admin Control Center
      const formattedGatewayKeys = gatewayKeys.map((k) => ({
        id: `gw_${k.id}`,
        rawId: k.id,
        source: 'API GATEWAY',
        email: k.userEmail || 'utente@devkernelpulse.com',
        username: k.userEmail || 'utente@devkernelpulse.com',
        licenseKey: k.keyMasked || k.keyPrefix || 'dkp_live_...',
        role: k.role || 'PRO',
        usage: k.usageCount || 0,
        status: (k.status || 'ACTIVE').toUpperCase(),
        joined: k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '2026-10-20'
      }))

      // Recupero licenze d'acquisto
      const storeLicenses = await db
        .select()
        .from(licenses)
        .orderBy(desc(licenses.createdAt))

      const formattedLicenses = storeLicenses.map((l) => ({
        id: `lic_${l.id}`,
        rawId: l.id,
        source: 'STORE LICENSE',
        email: l.customerEmail,
        username: l.customerEmail,
        licenseKey: l.licenseKey,
        role: l.productName || 'PRO',
        usage: `${l.downloadsCount} / ${l.maxDownloads}`,
        status: (l.status || 'ACTIVE').toUpperCase(),
        joined: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '2026-10-20'
      }))

      const allKeys = [...formattedGatewayKeys, ...formattedLicenses]

      return {
        success: true,
        data: allKeys
      }
    } catch (err: any) {
      console.error('Errore recupero chiavi/licenze da Neon DB:', err)
      return {
        success: false,
        message: 'Impossibile recuperare le chiavi dal database.',
        error: err.message
      }
    }
  }

  // 2. POST: Aggiornamento stato della chiave/licenza
  if (method === 'POST') {
    const body = await readBody(event)
    const { id, status } = body

    if (!id || !status) {
      setResponseStatus(event, 400)
      return { success: false, message: 'Parametri id e status obbligatori.' }
    }

    try {
      const idStr = String(id)
      const targetStatus = String(status).toUpperCase()

      if (idStr.startsWith('gw_')) {
        const numericId = parseInt(idStr.replace('gw_', ''), 10)
        await db
          .update(apiKeys)
          .set({ status: targetStatus })
          .where(eq(apiKeys.id, numericId))
      } else if (idStr.startsWith('lic_')) {
        const rawUuid = idStr.replace('lic_', '')
        const licStatus = targetStatus.toLowerCase() as any
        await db
          .update(licenses)
          .set({ status: licStatus })
          .where(eq(licenses.id, rawUuid))
      } else {
        // Fallback per ID numerico diretto
        const numericId = parseInt(idStr, 10)
        if (!isNaN(numericId)) {
          await db
            .update(apiKeys)
            .set({ status: targetStatus })
            .where(eq(apiKeys.id, numericId))
        }
      }

      return {
        success: true,
        message: `Stato della chiave aggiornato con successo in ${targetStatus}.`
      }
    } catch (err: any) {
      console.error('Errore aggiornamento stato chiave:', err)
      setResponseStatus(event, 500)
      return { success: false, message: 'Errore durante l\'aggiornamento dello stato.' }
    }
  }
})