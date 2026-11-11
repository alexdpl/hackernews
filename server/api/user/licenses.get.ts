// server/api/user/licenses.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const query = getQuery(event)
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  
  // Fallback flessibile per l'ID utente: cookie -> query param -> utente default (1)
  const userId = sessionUserCookie 
    ? parseInt(sessionUserCookie, 10) 
    : (query.userId ? parseInt(String(query.userId), 10) : 1)

  const db = getDb()

  try {
    const userLicenses = await db
      .select({
        id: licenses.id,
        product: licenses.productName,
        key: licenses.licenseKey,
        status: licenses.status,
        expires: licenses.expiresAt,
        createdAt: licenses.createdAt
      })
      .from(licenses)
      .where(eq(licenses.userId, userId))
      .orderBy(desc(licenses.createdAt))

    const formattedData = userLicenses.map(lic => {
      let expiresStr = 'Lifetime'
      if (lic.expires) {
        const d = lic.expires instanceof Date ? lic.expires : new Date(lic.expires)
        if (!isNaN(d.getTime())) {
          expiresStr = d.toLocaleDateString('it-IT')
        }
      }

      return {
        id: lic.id,
        product: lic.product,
        key: lic.key,
        status: lic.status,
        expires: expiresStr
      }
    })

    return {
      success: true,
      data: formattedData
    }
  } catch (error: any) {
    console.error('❌ Errore recupero licenze utente:', error?.message || error)
    // Fallback sicuro senza far crollare la dashboard
    return {
      success: true,
      data: []
    }
  }
})