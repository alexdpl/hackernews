// server/api/admin/sentinel/stream.get.ts
import { defineEventHandler, getHeader } from 'h3'

const ATTACK_TYPES = [
  'SQL Injection (Union Payload)',
  'Cross-Site Scripting (Reflected XSS)',
  'Path Traversal (/etc/shadow attempt)',
  'L7 DDoS Flood / Rate Limit Trigger',
  'Auth Vault Brute Force Attack',
  'Admin Route Unauthorized Scan',
  'JWT Signature Tampering',
  'Remote Code Execution (RCE Exploit)'
]

const COUNTRIES = [
  { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: 'CN', flag: '🇨🇳', name: 'China' },
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' }
]

function getRandomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateRandomIp(): string {
  return `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`
}

export default defineEventHandler((event) => {
  const res = event.node.res
  const req = event.node.req

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Cloud-Region': 'europe-west4',
    'X-DKP-Version': 'v2.5-GOLD'
  })

  const clientIp = getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() || getHeader(event, 'x-real-ip') || '127.0.0.1'
  
  res.write(`event: connected\ndata: ${JSON.stringify({
    message: `🛡️ GCP Sentinel Live Stream Connesso [IP Admin: ${clientIp}]`
  })}\n\n`)

  const interval = setInterval(() => {
    if (res.writableEnded || res.destroyed) {
      clearInterval(interval)
      return
    }

    const country = getRandomItem(COUNTRIES)
    const attackType = getRandomItem(ATTACK_TYPES)
    
    // Logica di gravità dinamica
    let severity = 'MEDIUM'
    let riskScore = Math.floor(Math.random() * 30) + 40
    let action = 'RATE_LIMITED_429'

    if (attackType.includes('SQL') || attackType.includes('RCE')) {
      severity = 'CRITICAL'
      riskScore = Math.floor(Math.random() * 10) + 90
      action = 'IP_BANNED'
    } else if (attackType.includes('XSS') || attackType.includes('Vault')) {
      severity = 'HIGH'
      riskScore = Math.floor(Math.random() * 20) + 70
      action = 'BLOCKED_403'
    }

    const threatLog = {
      id: `th_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().substring(11, 19),
      ip: generateRandomIp(),
      countryCode: country.code,
      countryFlag: country.flag,
      countryName: country.name,
      attackType,
      severity,
      riskScore, // Nuovo campo inviato allo stream per il frontend
      action,
      region: 'europe-west4',
      endpoint: getRandomItem(['/api/admin', '/api/vault/decrypt', '/api/users', '/_nuxt/payload.js'])
    }

    res.write(`event: threat\ndata: ${JSON.stringify(threatLog)}\n\n`)
  }, Math.floor(Math.random() * 2000) + 1500)

  req.on('close', () => {
    clearInterval(interval)
    if (!res.writableEnded) res.end()
  })
})