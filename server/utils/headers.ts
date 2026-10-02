// server/utils/headers.ts

/**
 * Utility universale per la lettura sicura degli header HTTP in Nuxt 3 / Nitro.
 * Evita il crash `event.req.headers.get is not a function` su Node.js local / GCP.
 */
export function getSafeHeader(event: any, name: string): string {
  if (!event) return ''
  const lowerName = name.toLowerCase()

  // 1. Lettura diretta da Node.js IncomingMessage (Locale / PM2 su GCP)
  const nodeHeaders = event.node?.req?.headers || event.req?.headers
  if (nodeHeaders && typeof nodeHeaders === 'object' && !('get' in nodeHeaders)) {
    const val = nodeHeaders[lowerName]
    if (Array.isArray(val)) return val[0] || ''
    if (typeof val === 'string') return val
    if (typeof val === 'number') return String(val)
  }

  // 2. Lettura da Web Standard Fetch API (Workers / Cloudflare / Edge)
  if (event.req?.headers?.get && typeof event.req.headers.get === 'function') {
    return event.req.headers.get(lowerName) || ''
  }

  return ''
}