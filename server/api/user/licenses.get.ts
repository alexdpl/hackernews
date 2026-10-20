// server/api/user/licenses.get.ts
import { defineEventHandler, createError, getCookie, getQuery } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  
  // Fallback flessibile: cookie -> query param -> utente default (1)
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

    return {
      success: true,
      data: userLicenses.map(lic => ({
        id: lic.id,
        product: lic.product,
        key: lic.key,
        status: lic.status,
        expires: lic.expires ? new Date(lic.expires).toLocaleDateString('it-IT') : 'Lifetime'
      }))
    }
  } catch (error: any) {
    console.error('❌ Errore recupero licenze utente:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore recupero licenze: ${error.message}`
    })
  }
})