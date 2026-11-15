// server/api/vault/notarize.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { VaultService } from '~~/server/services/vault.service'
import type { VaultEntityType } from '~~/server/utils/blockchainService'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const targetId = Number(body.entityId || body.postId)
  const entityType = (body.entityType === 'blog' ? 'blog' : 'forum') as VaultEntityType

  if (!targetId || isNaN(targetId)) {
    throw createError({ statusCode: 400, statusMessage: 'postId o entityId obbligatorio per la notarizzazione SHA-256.' })
  }

  const proof = await VaultService.notarizePost(targetId, entityType)
  if (!proof) {
    throw createError({ statusCode: 404, statusMessage: 'Contenuto non trovato.' })
  }

  return {
    success: true,
    proof
  }
})