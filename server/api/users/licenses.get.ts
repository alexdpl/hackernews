// server/api/user/licenses.get.ts
import { defineEventHandler, createError, getCookie } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  // Recupero ID utente dai cookie di sessione (o event.context se usi un middleware auth)
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = sessionUserCookie ? parseInt(sessionUserCookie, 10) : null

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorizzato. Effettua il login.' })
  }

  const db = getDb()
  
  try {
    const userLicenses = await db
      .select({
        id: licenses.id,
        product: licenses.productName,
        key: licenses.licenseKey,
        status: licenses.status,
        expires: licenses.expiresAt,
      })
      .from(licenses)
      .where(eq(licenses.userId, userId))
      .orderBy(desc(licenses.createdAt))

    return {
      success: true,
      data: userLicenses.map(lic => ({
        ...lic,
        expires: lic.expires ? new Date(lic.expires).toLocaleDateString('it-IT') : 'Lifetime'
      }))
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Errore durante il recupero licenze' })
  }
})