// server/api/admin/sentinel/stream.get.ts
import { defineEventHandler, getHeader } from 'h3'

const ATTACK_TYPES = [
  'SQL Injection (Blind Payload)',
  'Cross-Site Scripting (XSS Vector)',
  'Path Traversal (/etc/passwd attempt)',
  'L7 DDoS Flood / Rate Limit Exceeded',
  'Auth Vault Brute Force Attack',
  'Unauthorized Admin Route Scan',
  'JWT Token Tampering / Signature Mismatch',
  'Remote Code Execution (RCE Exploit)'
]

const COUNTRIES = [
  { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: 'CN', flag: '🇨🇳', name: 'China' },
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy' }
]

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const ACTIONS = ['BLOCKED_403', 'RATE_LIMITED_429', 'IP_BANNED', 'CHALLENGE_FAILED'] as const

function getRandomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateRandomIp(): string {
  const p1 = Math.floor(Math.random() * 200) + 10
  const p2 = Math.floor(Math.random() * 250)
  return `${p1}.${p2}.xxx.${Math.floor(Math.random() * 254) + 1}`
}

function getClientIp(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return getHeader(event, 'x-real-ip') || event.node?.req?.socket?.remoteAddress || '127.0.0.1'
}

function parseUserAgent(ua?: string): string {
  if (!ua) return 'Client Sconosciuto'
  if (ua.includes('Firefox')) return 'Firefox Browser'
  if (ua.includes('Edg')) return 'Microsoft Edge'
  if (ua.includes('Chrome')) return 'Google Chrome'
  if (ua.includes('Safari')) return 'Apple Safari'
  if (ua.includes('bot') || ua.includes('crawler')) return 'Bot / Crawler'
  return 'Browser Web'
}

export default defineEventHandler((event) => {
  // Utilizziamo direttamente lo stream HTTP nativo di Node.js (event.node.res / event.node.req)
  // Questo elimina ogni problema di incompatibilità tra versioni di H3 o polyfill Fetch API
  const res = event.node.res
  const req = event.node.req

  // Impostiamo direttamente gli header HTTP per la connessione SSE streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  // Estraiamo i dati reali del client
  const clientIp = getClientIp(event)
  const userAgent = parseUserAgent(getHeader(event, 'user-agent'))

  // 1. Invio del messaggio di benvenuto SSE iniziale
  const connectedPayload = JSON.stringify({
    message: `🛡️ Sentinel Stream Connected [IP Reale: ${clientIp} | Browser: ${userAgent}]`
  })
  res.write(`event: connected\ndata: ${connectedPayload}\n\n`)

  // 2. Timer per lo streaming continuo dei log di minaccia
  const interval = setInterval(() => {
    if (res.writableEnded || res.destroyed) {
      clearInterval(interval)
      return
    }

    const country = getRandomItem(COUNTRIES)
    const severity = getRandomItem(SEVERITIES)
    const attackType = getRandomItem(ATTACK_TYPES)
    const action = severity === 'CRITICAL' ? 'IP_BANNED' : getRandomItem(ACTIONS)

    const threatLog = {
      id: `th_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().substring(11, 19),
      ip: generateRandomIp(),
      countryCode: country.code,
      countryFlag: country.flag,
      countryName: country.name,
      attackType,
      severity,
      action,
      endpoint: getRandomItem(['/api/v1/auth/token', '/api/vault/decrypt', '/admin/login', '/api/blog/posts', '/.env'])
    }

    res.write(`event: threat\ndata: ${JSON.stringify(threatLog)}\n\n`)
  }, Math.floor(Math.random() * 2000) + 1500)

  // 3. Chiusura e pulizia automatica quando l'utente lascia la pagina o chiude il browser
  req.on('close', () => {
    clearInterval(interval)
    if (!res.writableEnded) {
      res.end()
    }
  })
})