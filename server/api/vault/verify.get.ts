// server/api/vault/verify.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { VaultService } from '~~/server/services/vault.service'
import type { VaultEntityType } from '~~/server/utils/blockchainService'

function parsePositiveInt32(raw: unknown, fieldName: string): number | undefined {
  if (raw === undefined || raw === null || String(raw).trim() === '') return undefined
  const str = String(raw).trim()
  const num = Number(str)
  if (!/^\d+$/.test(str) || !Number.isSafeInteger(num) || num <= 0 || num > 2147483647) {
    throw createError({
      statusCode: 400,
      statusMessage: `Parametro ${fieldName} non valido.`
    })
  }
  return num
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const postId = parsePositiveInt32(query.postId, 'postId')
  const entityId = parsePositiveInt32(query.entityId, 'entityId') ?? postId

  const slug = query.slug !== undefined && String(query.slug).trim() !== ''
    ? String(query.slug).trim()
    : undefined

  if (slug && slug.length > 255) {
    throw createError({ statusCode: 400, statusMessage: 'Parametro slug troppo lungo (max 255 caratteri).' })
  }

  let hash: string | undefined
  if (query.hash !== undefined && String(query.hash).trim() !== '') {
    const cleanHash = String(query.hash).trim().toLowerCase()
    if (!/^[a-f0-9]{64}$/.test(cleanHash)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Formato hash SHA-256 non valido (attesi 64 caratteri esadecimali).'
      })
    }
    hash = cleanHash
  }

  if (query.entityType !== undefined && query.entityType !== 'blog' && query.entityType !== 'forum') {
    throw createError({
      statusCode: 400,
      statusMessage: 'entityType non valido (valori consentiti: "forum" o "blog").'
    })
  }

  const entityType = (query.entityType === 'blog' ? 'blog' : 'forum') as VaultEntityType

  if (!entityId && !slug && !hash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Specifica postId, entityId, slug o hash SHA-256 da verificare.'
    })
  }

  try {
    const verification = await VaultService.verifyProof({ entityId, slug, entityType, hash })
    return {
      success: true,
      ...verification
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [VAULT VERIFY ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante la verifica crittografica sul DKP Vault.'
    })
  }
})