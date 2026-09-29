// server/utils/license.ts
import crypto from 'crypto'

/**
 * Genera una License Key formattata (es. DKP-CRW-A1B2-C3D4-E5F6)
 */
export function generateLicenseKey(prefix: string = 'DKP'): string {
  const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase() // 16 caratteri
  
  // Format: DKP-CRW-XXXX-YYYY-ZZZZ
  const part1 = randomHex.slice(0, 4)
  const part2 = randomHex.slice(4, 8)
  const part3 = randomHex.slice(8, 12)
  const part4 = randomHex.slice(12, 16)

  return `${cleanPrefix}-${part1}-${part2}-${part3}-${part4}`
}