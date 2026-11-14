// server/api/vault/verify.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { VaultService } from '~~/server/services/vault.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = query.postId ? Number(query.postId) : undefined
  const hash = query.hash ? String(query.hash).trim() : undefined

  if (!postId && !hash) {
    throw createError({ statusCode: 400, statusMessage: 'Specifica postId o hash SHA-256 da verificare.' })
  }

  const verification = await VaultService.verifyProof({ postId, hash })
  return {
    success: true,
    ...verification
  }
})