// server/api/user/keys/generate.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { randomBytes, createHash } from 'node:crypto'
import { getDb } from '~~/server/utils/db'
import { apiKeys } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const body = (await readBody(event)) || {}
  const keyName = body.name?.trim() || 'Default Production API Key'
  const role = body.role?.trim() || 'PRO'

  try {
    // Generiamo 32 byte di entropia pura (64 caratteri hex)
    const rawSecret = randomBytes(32).toString('hex')
    const fullApiKey = `dkp_live_${rawSecret}`
    const keyPrefix = fullApiKey.substring(0, 16)
    const keyMasked = `${fullApiKey.substring(0, 12)}...${fullApiKey.substring(fullApiKey.length - 4)}`

    // Hash della chiave per la verifica sicura lato server
    const hashedKey = createHash('sha256').update(fullApiKey).digest('hex')

    // Inserimento su Neon DB
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        name: keyName,
        keyPrefix: keyPrefix,
        keyMasked: keyMasked,
        hashedKey: hashedKey,
        role: role,
        status: 'ACTIVE',
        usageCount: 0,
        rateLimit: 1000,
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