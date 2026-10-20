// server/api/user/keys/generate.post.ts
import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { randomBytes, scryptSync } from 'node:crypto'
import { getDb } from '~~/server/utils/db'
import { apiKeys } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const body = (await readBody(event)) || {}
  const keyName = body.name?.trim() || 'Default Production API Key'
  const role = body.role?.trim() || 'PRO'

  // Recupero userId dai cookie (fallback a 1 per test admin se non trovato)
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = sessionUserCookie ? parseInt(sessionUserCookie, 10) : 1

  try {
    // Generiamo 32 byte di entropia pura (64 caratteri hex)
    const rawSecret = randomBytes(32).toString('hex')
    const fullApiKey = `dkp_live_${rawSecret}`
    const keyPrefix = fullApiKey.substring(0, 16)
    const keyMasked = `${fullApiKey.substring(0, 12)}...${fullApiKey.substring(fullApiKey.length - 4)}`

      // Hash della chiave per la verifica sicura lato server (KDF resistente a brute-force)
    const salt = randomBytes(16).toString('hex')
    const derivedKey = scryptSync(fullApiKey, salt, 64).toString('hex')
    const hashedKey = `${salt}:${derivedKey}`
	
    // Inserimento su Neon DB corretto
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        userId: userId, // Associa la chiave all'utente corretto
        name: keyName,
        keyPrefix: keyPrefix,
        keyMasked: keyMasked,
        keyHash: hashedKey, // 👈 FIX: Nome corretto mappato dallo schema
        role: role,
        status: 'ACTIVE',
        usageCount: 0,
        createdAt: new Date()
      })
      .returning()

    return {
      success: true,
      message: '🔑 Nuova API Key generata e salvata con successo nel DB Neon!',
      // La fullApiKey viene restituita SOLO una volta al momento della creazione
      rawApiKey: fullApiKey,
      keyData: insertedKey
    }
  } catch (error: any) {
    console.error('❌ Errore generazione API Key:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Impossibile generare la chiave API: ${error.message}`
    })
  }
})