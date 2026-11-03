// server/api/vault/notarize.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { validateSdkKey } from '../../utils/useSdkAuth'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // Validazione API Key
  await validateSdkKey(event)

  const body = await readBody(event)
  const { title, content, code, language } = body || {}

  const sourceCode = code || content || ''

  if (!title || !sourceCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campi obbligatori mancanti: title e code/content.'
    })
  }

  // Generazione certificato SHA-256 e ID Vault
  const hashSha256 = crypto.createHash('sha256').update(sourceCode).digest('hex')
  const certificateId = `vlt_${crypto.randomBytes(4).toString('hex')}`

  return {
    success: true,
    data: {
      certificateId,
      hashSha256,
      title,
      language: language || 'typescript',
      timestamp: new Date().toISOString(),
      status: 'NOTARIZED_IN_VAULT'
    }
  }
})