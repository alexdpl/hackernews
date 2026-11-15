// server/api/vault/verify.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { VaultService } from '~~/server/services/vault.service'
import type { VaultEntityType } from '~~/server/utils/blockchainService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = query.postId ? Number(query.postId) : undefined
  const entityId = query.entityId ? Number(query.entityId) : postId
  const slug = query.slug ? String(query.slug).trim() : undefined
  const hash = query.hash ? String(query.hash).trim() : undefined
  const entityType = (query.entityType === 'blog' ? 'blog' : 'forum') as VaultEntityType

  if (!entityId && !slug && !hash) {
    throw createError({ statusCode: 400, statusMessage: 'Specifica postId, entityId, slug o hash SHA-256 da verificare.' })
  }

  const verification = await VaultService.verifyProof({ entityId, slug, entityType, hash })
  return {
    success: true,
    ...verification
  }
})