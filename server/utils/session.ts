// server/utils/session.ts
import crypto from 'node:crypto'
import {
  type H3Event,
  parseCookies,
  getRequestHeader,
  setCookie,
  deleteCookie
} from 'h3'

export interface DkpSessionUser {
  id: number
  username: string
  email?: string
  role: string
  isAdmin?: boolean
  avatarUrl?: string | null
  exp?: number
}

const SESSION_COOKIE_NAMES = ['dkp_session', 'dkp_token', 'auth_token', 'token', 'session'] as const
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 giorni

function getSigningSecret(): string {
  let config: any = {}
  try {
    config = useRuntimeConfig()
  } catch {}

  const secret =
    config?.authSecret ||
    config?.jwtSecret ||
    process.env.NUXT_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.DATABASE_URL

  if (!secret || typeof secret !== 'string') {
    throw new Error('Secret di firma sessione non configurato (imposta NUXT_AUTH_SECRET o JWT_SECRET).')
  }

  return secret.trim()
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + '='.repeat(padLength), 'base64').toString('utf-8')
}

function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Genera un token di sessione firmato HMAC-SHA256: <payloadBase64Url>.<signatureBase64Url>
 */
export function signDkpSessionToken(user: Partial<DkpSessionUser> & Record<string, any>): string {
  const nowSec = Math.floor(Date.now() / 1000)
  const role = String(user.role || 'user').toLowerCase()

  const payload: DkpSessionUser = {
    id: Number(user.id),
    username: String(user.username || '').trim(),
    ...(user.email ? { email: String(user.email).trim() } : {}),
    role,
    isAdmin: role === 'admin',
    ...(user.avatarUrl || user.avatar ? { avatarUrl: String(user.avatarUrl || user.avatar) } : {}),
    exp: nowSec + SESSION_TTL_SECONDS
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

/**
 * Verifica la firma crittografica e la scadenza del token di sessione (formato DKP o JWT HS256).
 */
function verifyAndDecodeToken(raw: string): DkpSessionUser | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  const secret = getSigningSecret()
  const parts = trimmed.split('.')

  // 1. Formato token firmato DKP: <payload>.<hmacSignature>
  if (parts.length === 2 && parts[0] && parts[1]) {
    const [encodedPayload, providedSig] = parts
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url')

    if (!safeTimingEqual(providedSig, expectedSig)) {
      return null
    }

    try {
      const parsed = JSON.parse(base64UrlDecode(encodedPayload))
      return validateDecodedUser(parsed?.user || parsed)
    } catch {
      return null
    }
  }

  // 2. Formato JWT HS256: <header>.<payload>.<hmacSignature>
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const [encodedHeader, encodedPayload, providedSig] = parts
    try {
      const header = JSON.parse(base64UrlDecode(encodedHeader))
      if (header?.alg !== 'HS256') return null
    } catch {
      return null
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    if (!safeTimingEqual(providedSig, expectedSig)) {
      return null
    }

    try {
      const parsed = JSON.parse(base64UrlDecode(encodedPayload))
      return validateDecodedUser(parsed?.user || parsed)
    } catch {
      return null
    }
  }

  return null
}

function validateDecodedUser(candidate: any): DkpSessionUser | null {
  if (!candidate || typeof candidate !== 'object') return null

  const numericId = Number(candidate.id ?? candidate.userId ?? candidate.sub)
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return null
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (typeof candidate.exp === 'number' && candidate.exp <= nowSec) {
    return null
  }

  const role = String(candidate.role || 'user').toLowerCase()

  return {
    id: numericId,
    username: String(candidate.username || '').trim(),
    ...(candidate.email ? { email: String(candidate.email).trim() } : {}),
    role,
    isAdmin: role === 'admin',
    avatarUrl: candidate.avatarUrl || candidate.avatar || null,
    ...(typeof candidate.exp === 'number' ? { exp: candidate.exp } : {})
  }
}

export function extractDkpUserFromEvent(event: H3Event): DkpSessionUser | null {
  const cookies = parseCookies(event)
  const rawValues: string[] = []

  for (const name of SESSION_COOKIE_NAMES) {
    if (cookies[name]) rawValues.push(cookies[name])
  }

  const rawHeader = getRequestHeader(event, 'cookie') || ''
  if (rawHeader) {
    for (const name of SESSION_COOKIE_NAMES) {
      const match = rawHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
      if (match?.[1]) rawValues.push(match[1])
    }
  }

  // Supporto opzionale header Authorization: Bearer <token>
  const authHeader = getRequestHeader(event, 'authorization') || ''
  if (/^Bearer\s+/i.test(authHeader)) {
    rawValues.push(authHeader.replace(/^Bearer\s+/i, '').trim())
  }

  for (const raw of rawValues) {
    const candidates = [raw]
    try {
      const decoded = decodeURIComponent(raw)
      if (decoded !== raw) candidates.push(decoded)
    } catch {}

    for (const candidate of candidates) {
      const verifiedUser = verifyAndDecodeToken(candidate)
      if (verifiedUser) {
        return verifiedUser
      }
    }
  }

  return null
}

function isProdHost(event: H3Event): boolean {
  const host = (
    getRequestHeader(event, 'x-forwarded-host') ||
    getRequestHeader(event, 'host') ||
    ''
  )
    .split(':')[0]
    .trim()
    .toLowerCase()

  return host === 'devkernelpulse.org' || host.endsWith('.devkernelpulse.org')
}

export function syncCrossSubdomainSessionCookie(event: H3Event, user: Partial<DkpSessionUser> & Record<string, any>) {
  if (!user || !user.id) return

  const signedToken = signDkpSessionToken(user)
  const prod = isProdHost(event)

  setCookie(event, 'dkp_session', signedToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: prod,
    maxAge: SESSION_TTL_SECONDS,
    ...(prod ? { domain: '.devkernelpulse.org' } : {})
  })
}

export function clearCrossSubdomainSessionCookie(event: H3Event) {
  const prod = isProdHost(event)
  const baseOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: prod,
    ...(prod ? { domain: '.devkernelpulse.org' } : {})
  }

  for (const name of SESSION_COOKIE_NAMES) {
    deleteCookie(event, name, baseOptions)
    if (prod) {
      deleteCookie(event, name, { path: '/' })
    }
  }
}