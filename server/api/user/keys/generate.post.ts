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

  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = sessionUserCookie ? parseInt(sessionUserCookie, 10) : 1

  try {
    const rawSecret = randomBytes(32).toString('hex')
    const fullApiKey = `dkp_live_${rawSecret}`
    const keyPrefix = fullApiKey.substring(0, 16)
    const keyMasked = `${fullApiKey.substring(0, 12)}...${fullApiKey.substring(fullApiKey.length - 4)}`

    const salt = randomBytes(16).toString('hex')
    const derivedKey = scryptSync(fullApiKey, salt, 64).toString('hex')
    const hashedKey = `${salt}:${derivedKey}`
	
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        userId: userId,
        name: keyName,
        keyPrefix: keyPrefix,
        keyMasked: keyMasked,
        keyHash: hashedKey,
        role: role,
        status: 'ACTIVE',
        usageCount: 0,
        createdAt: new Date()
      })
      .returning()

    return {
      success: true,
      message: '🔑 Nuova API Key generata e salvata con successo nel DB Neon!',
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