// server/api/user/keys/revoke.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { apiKeys } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const body = (await readBody(event)) || {}
  const { id } = body

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID della chiave API obbligatorio' })
  }

  try {
    await db
      .update(apiKeys)
      .set({ status: 'REVOKED' })
      .where(eq(apiKeys.id, id))

    return {
      success: true,
      message: '🚫 API Key revocata permanentemente dal database Neon.'
    }
  } catch (error: any) {
    console.error('❌ Errore revoca API Key:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore revoca chiave: ${error.message}`
    })
  }
})