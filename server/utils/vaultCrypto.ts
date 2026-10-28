// server/utils/vaultCrypto.ts
import { createHash } from 'crypto'

export interface VaultProofResult {
  hash: string
  certificateId: string
  timestamp: string
}

/**
 * Genera una firma crittografica SHA-256 per il Proof-of-Code del Vault
 */
export function generateVaultProof(title: string, content: string, userId: number): VaultProofResult {
  const timestamp = new Date().toISOString()
  const rawData = `DKP_VAULT::${userId}::${title}::${content}::${timestamp}`
  
  const hash = createHash('sha256').update(rawData).digest('hex')
  const certificateId = `DKP-CERT-${hash.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  return {
    hash,
    certificateId,
    timestamp
  }
}