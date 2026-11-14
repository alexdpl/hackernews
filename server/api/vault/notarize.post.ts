// server/api/vault/notarize.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { VaultService } from '~~/server/services/vault.service'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const postId = Number(body.postId)

  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: 'postId obbligatorio per la notarizzazione SHA-256.' })
  }

  const proof = await VaultService.notarizePost(postId)
  if (!proof) {
    throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
  }

  return {
    success: true,
    proof
  }
})