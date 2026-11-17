// server/api/auth/[provider].get.ts
import crypto from 'node:crypto'
import {
  defineEventHandler,
  getRouterParam,
  getQuery,
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeader,
  sendRedirect,
  createError
} from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { syncCrossSubdomainSessionCookie } from '~~/server/utils/session'

type ActiveOAuthProvider =
  | 'github'
  | 'google'
  | 'gitlab'
  | 'bitbucket'
  | 'stackoverflow'

const ACTIVE_PROVIDERS = new Set<ActiveOAuthProvider>([
  'github',
  'google',
  'gitlab',
  'bitbucket',
  'stackoverflow'
])

const OAUTH_STATE_COOKIE = 'dkp_oauth_state'

interface NormalizedOAuthProfile {
  provider: ActiveOAuthProvider
  providerId: string
  username: string
  email: string | null
  emailVerified: boolean
  avatarUrl: string | null
  bio: string
}

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function safeTimingEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function sanitizeRedirectPath(raw: unknown, fallback = '/user/dashboard'): string {
  const val = String(raw || '').trim()
  if (!val || !val.startsWith('/') || val.startsWith('//') || val.includes('\\')) {
    return fallback
  }
  return val
}

function getRequestOrigin(event: any): string {
  const configuredUrl = String(process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim()
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '')
  }

  const host = (
    getRequestHeader(event, 'x-forwarded-host') ||
    getRequestHeader(event, 'host') ||
    'devkernelpulse.org'
  )
    .split(',')[0]
    .trim()

  const protoHeader = (getRequestHeader(event, 'x-forwarded-proto') || '').split(',')[0].trim()
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  const proto = protoHeader || (isLocal ? 'http' : 'https')

  return `${proto}://${host}`
}

function getProviderCredentials(provider: ActiveOAuthProvider) {
  const upper = provider.toUpperCase()

  // Su Bitbucket il Client ID nel pannello OAuth Consumer si chiama "Key"
  const clientId = String(
    process.env[`${upper}_CLIENT_ID`] ||
    process.env[`NUXT_OAUTH_${upper}_CLIENT_ID`] ||
    (provider === 'bitbucket' ? process.env.BITBUCKET_KEY : '') ||
    ''
  ).trim()

  const clientSecret = String(
    process.env[`${upper}_CLIENT_SECRET`] ||
    process.env[`NUXT_OAUTH_${upper}_CLIENT_SECRET`] ||
    ''
  ).trim()

  const apiKey = provider === 'stackoverflow'
    ? String(process.env.STACKOVERFLOW_KEY || process.env.NUXT_OAUTH_STACKOVERFLOW_KEY || '').trim()
    : ''

  return { clientId, clientSecret, apiKey }
}

function buildAuthorizeUrl(
  provider: ActiveOAuthProvider,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state
  })

  switch (provider) {
    case 'github':
      params.set('scope', 'read:user user:email')
      return `https://github.com/login/oauth/authorize?${params.toString()}`

    case 'google':
      params.set('response_type', 'code')
      params.set('scope', 'openid email profile')
      params.set('prompt', 'select_account')
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    case 'gitlab':
      params.set('response_type', 'code')
      params.set('scope', 'read_user')
      return `https://gitlab.com/oauth/authorize?${params.toString()}`

    case 'bitbucket':
      params.set('response_type', 'code')
      params.set('scope', 'account email')
      return `https://bitbucket.org/site/oauth2/authorize?${params.toString()}`

    case 'stackoverflow':
      params.set('scope', '')
      return `https://stackoverflow.com/oauth?${params.toString()}`
  }
}

async function exchangeCodeForProfile(
  provider: ActiveOAuthProvider,
  code: string,
  redirectUri: string,
  creds: { clientId: string; clientSecret: string; apiKey: string }
): Promise<NormalizedOAuthProfile> {
  const { clientId, clientSecret, apiKey } = creds

  if (provider === 'github') {
    const tokenRes: any = await $fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: { client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }
    })
    const accessToken = tokenRes?.access_token
    if (!accessToken) throw new Error('Token GitHub non ricevuto.')

    const ghUser: any = await $fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DevKernelPulse-v2.6' }
    })

    let email: string | null = ghUser?.email || null
    let emailVerified = Boolean(ghUser?.email)

    if (!email) {
      const emails: any[] = await $fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DevKernelPulse-v2.6' }
      }).catch(() => [])
      const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
      if (primary?.email) {
        email = primary.email
        emailVerified = true
      }
    }

    return {
      provider: 'github',
      providerId: String(ghUser.id),
      username: String(ghUser.login || `gh_${ghUser.id}`),
      email,
      emailVerified,
      avatarUrl: ghUser.avatar_url || null,
      bio: String(ghUser.bio || '').slice(0, 450)
    }
  }

  if (provider === 'google') {
    const tokenRes: any = await $fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    })
    const accessToken = tokenRes?.access_token
    if (!accessToken) throw new Error('Token Google non ricevuto.')

    const gUser: any = await $fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const baseHandle = gUser.email
      ? String(gUser.email).split('@')[0]
      : String(gUser.name || `google_${gUser.sub}`)

    return {
      provider: 'google',
      providerId: String(gUser.sub),
      username: baseHandle,
      email: gUser.email || null,
      emailVerified: Boolean(gUser.email_verified),
      avatarUrl: gUser.picture || null,
      bio: ''
    }
  }

  if (provider === 'gitlab') {
    const tokenRes: any = await $fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    })
    const accessToken = tokenRes?.access_token
    if (!accessToken) throw new Error('Token GitLab non ricevuto.')

    const glUser: any = await $fetch('https://gitlab.com/api/v4/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    return {
      provider: 'gitlab',
      providerId: String(glUser.id),
      username: String(glUser.username || `gl_${glUser.id}`),
      email: glUser.email || null,
      emailVerified: Boolean(glUser.confirmed_at || glUser.email),
      avatarUrl: glUser.avatar_url || null,
      bio: String(glUser.bio || '').slice(0, 450)
    }
  }

  if (provider === 'bitbucket') {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes: any = await $fetch('https://bitbucket.org/site/oauth2/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    })
    const accessToken = tokenRes?.access_token
    if (!accessToken) throw new Error('Token Bitbucket non ricevuto.')

    const bbUser: any = await $fetch('https://api.bitbucket.org/2.0/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const bbEmailsRes: any = await $fetch('https://api.bitbucket.org/2.0/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).catch(() => ({ values: [] }))

    const emailEntries: any[] = Array.isArray(bbEmailsRes?.values) ? bbEmailsRes.values : []
    const primaryEmail =
      emailEntries.find((e) => e.is_primary && e.is_confirmed) ||
      emailEntries.find((e) => e.is_confirmed)

    return {
      provider: 'bitbucket',
      providerId: String(bbUser.account_id || bbUser.uuid),
      username: String(bbUser.username || bbUser.nickname || `bb_${Date.now()}`),
      email: primaryEmail?.email || null,
      emailVerified: Boolean(primaryEmail?.is_confirmed),
      avatarUrl: bbUser?.links?.avatar?.href || null,
      bio: ''
    }
  }

  // Stack Overflow (Stack Exchange OAuth 2.0)
  const tokenRes: any = await $fetch('https://stackoverflow.com/oauth/access_token/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    }).toString()
  })
  const accessToken = tokenRes?.access_token
  if (!accessToken) throw new Error('Token Stack Overflow non ricevuto.')

  const seQuery = new URLSearchParams({
    site: 'stackoverflow',
    access_token: accessToken,
    ...(apiKey ? { key: apiKey } : {})
  })

  const seRes: any = await $fetch(`https://api.stackexchange.com/2.3/me?${seQuery.toString()}`)
  const seUser = Array.isArray(seRes?.items) ? seRes.items[0] : null
  if (!seUser) throw new Error('Profilo Stack Overflow non trovato.')

  return {
    provider: 'stackoverflow',
    providerId: String(seUser.account_id || seUser.user_id),
    username: String(seUser.display_name || `so_${seUser.account_id}`),
    email: null,
    emailVerified: false,
    avatarUrl: seUser.profile_image || null,
    bio: ''
  }
}

function normalizeUsernameCandidate(raw: string, provider: ActiveOAuthProvider): string {
  const cleaned = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)

  const reserved = new Set(['admin', 'administrator', 'root', 'system', 'support', 'staff', 'devkernelpulse', 'dkp'])
  if (!cleaned || cleaned.length < 3 || reserved.has(cleaned.toLowerCase())) {
    return `${provider}_dev_${crypto.randomBytes(3).toString('hex')}`
  }
  return cleaned
}

async function resolveUniqueUsername(db: any, desired: string, provider: ActiveOAuthProvider): Promise<string> {
  const base = normalizeUsernameCandidate(desired, provider)
  let candidate = base

  for (let attempt = 0; attempt < 10; attempt++) {
    const checkRes = await db.execute(sql`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${candidate}) LIMIT 1;
    `)
    if (!extractRows(checkRes)[0]) {
      return candidate
    }
    candidate = `${base.slice(0, 20)}_${crypto.randomBytes(2).toString('hex')}`
  }

  return `${provider}_${Date.now()}`
}

export default defineEventHandler(async (event) => {
  const providerParam = String(getRouterParam(event, 'provider') || '').trim().toLowerCase()
  if (!ACTIVE_PROVIDERS.has(providerParam as ActiveOAuthProvider)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Provider OAuth "${providerParam}" non attivo su questa istanza.`
    })
  }

  const provider = providerParam as ActiveOAuthProvider
  const query = getQuery(event)
  const origin = getRequestOrigin(event)
  const redirectUri = `${origin}/api/auth/${provider}`
  const creds = getProviderCredentials(provider)

  if (!creds.clientId || !creds.clientSecret) {
    return sendRedirect(
      event,
      `/login?error=oauth_not_configured&provider=${encodeURIComponent(provider)}`
    )
  }

  if (query.error) {
    return sendRedirect(
      event,
      `/login?error=oauth_denied&provider=${encodeURIComponent(provider)}`
    )
  }

  const code = query.code ? String(query.code).trim() : ''
  const returnedState = query.state ? String(query.state).trim() : ''

  // FASE 1: Avvio flusso OAuth -> generazione state anti-CSRF e redirect al provider
  if (!code) {
    const state = crypto.randomBytes(24).toString('hex')
    const safeRedirect = sanitizeRedirectPath(query.redirect, '/user/dashboard')
    const isHttps = origin.startsWith('https://')

    setCookie(
      event,
      OAUTH_STATE_COOKIE,
      JSON.stringify({ state, provider, redirectTo: safeRedirect }),
      {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isHttps,
        maxAge: 600
      }
    )

    const authorizeUrl = buildAuthorizeUrl(provider, creds.clientId, redirectUri, state)
    return sendRedirect(event, authorizeUrl)
  }

  // FASE 2: Callback OAuth -> verifica state CSRF e persistenza Pure SQL su Neon DB
  const rawStateCookie = getCookie(event, OAUTH_STATE_COOKIE)
  deleteCookie(event, OAUTH_STATE_COOKIE, { path: '/' })

  let savedState = ''
  let savedProvider = ''
  let redirectTo = '/user/dashboard'

  if (rawStateCookie) {
    try {
      const parsed = JSON.parse(rawStateCookie)
      savedState = String(parsed?.state || '')
      savedProvider = String(parsed?.provider || '')
      redirectTo = sanitizeRedirectPath(parsed?.redirectTo, '/user/dashboard')
    } catch {}
  }

  if (!savedState || !returnedState || savedProvider !== provider || !safeTimingEqual(savedState, returnedState)) {
    return sendRedirect(
      event,
      `/login?error=oauth_state_invalid&provider=${encodeURIComponent(provider)}`
    )
  }

  const db = await getDb()
  if (!db) {
    return sendRedirect(event, '/login?error=db_unavailable')
  }

  try {
    const profile = await exchangeCodeForProfile(provider, code, redirectUri, creds)

    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(40);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(191);`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`).catch(() => null)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';`).catch(() => null)

    // 1. Ricerca per (oauth_provider, oauth_provider_id)
    const byProviderRes = await db.execute(sql`
      SELECT id, username, email, role, COALESCE(xp, 0)::int AS xp, avatar_url AS "avatarUrl"
      FROM users
      WHERE oauth_provider = ${profile.provider}
        AND oauth_provider_id = ${profile.providerId}
      LIMIT 1;
    `)
    let dbUser = extractRows(byProviderRes)[0]

    // 2. Collegamento automatico ad account esistente se l'email è verificata dal provider
    if (!dbUser && profile.email && profile.emailVerified) {
      const byEmailRes = await db.execute(sql`
        SELECT id, username, email, role, COALESCE(xp, 0)::int AS xp, avatar_url AS "avatarUrl"
        FROM users
        WHERE LOWER(email) = LOWER(${profile.email})
        LIMIT 1;
      `)
      const existingByEmail = extractRows(byEmailRes)[0]

      if (existingByEmail) {
        const updatedRes = await db.execute(sql`
          UPDATE users
          SET
            oauth_provider = COALESCE(oauth_provider, ${profile.provider}),
            oauth_provider_id = COALESCE(oauth_provider_id, ${profile.providerId}),
            avatar_url = COALESCE(avatar_url, ${profile.avatarUrl})
          WHERE id = ${Number(existingByEmail.id)}
          RETURNING id, username, email, role, COALESCE(xp, 0)::int AS xp, avatar_url AS "avatarUrl";
        `)
        dbUser = extractRows(updatedRes)[0] || existingByEmail
      }
    }

    // 3. Creazione nuovo account USER su Neon DB
    if (!dbUser) {
      const uniqueUsername = await resolveUniqueUsername(db, profile.username, profile.provider)
      const fallbackEmail =
        profile.email && profile.emailVerified
          ? profile.email.toLowerCase()
          : `${profile.provider}_${profile.providerId}@oauth.devkernelpulse.org`

      const randomSecret = crypto.randomBytes(32).toString('hex')
      const salt = crypto.randomBytes(16).toString('hex')
      const randomPasswordHash = `${salt}:${crypto.scryptSync(randomSecret, salt, 64).toString('hex')}`
      const defaultAvatar =
        profile.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uniqueUsername)}`

      const insertRes = await db.execute(sql`
        INSERT INTO users (
          username,
          email,
          password_hash,
          role,
          xp,
          avatar_url,
          bio,
          oauth_provider,
          oauth_provider_id,
          created_at
        )
        VALUES (
          ${uniqueUsername},
          ${fallbackEmail},
          ${randomPasswordHash},
          'USER',
          150,
          ${defaultAvatar},
          ${profile.bio},
          ${profile.provider},
          ${profile.providerId},
          NOW()
        )
        RETURNING id, username, email, role, COALESCE(xp, 0)::int AS xp, avatar_url AS "avatarUrl";
      `)
      dbUser = extractRows(insertRes)[0]
    }

    if (!dbUser?.id) {
      throw new Error('Impossibile creare o recuperare il profilo utente OAuth.')
    }

    const normalizedRole = String(dbUser.role || 'user').toLowerCase()

    syncCrossSubdomainSessionCookie(event, {
      id: Number(dbUser.id),
      username: dbUser.username,
      email: dbUser.email,
      role: normalizedRole,
      isAdmin: normalizedRole === 'admin',
      avatarUrl: dbUser.avatarUrl || profile.avatarUrl || null
    })

    const finalDestination =
      normalizedRole === 'admin' && redirectTo === '/user/dashboard'
        ? '/admin'
        : redirectTo

    return sendRedirect(event, finalDestination)
  } catch (err: any) {
    console.error(`❌ [OAUTH ${provider.toUpperCase()} ERROR]:`, err?.message)
    return sendRedirect(
      event,
      `/login?error=oauth_exchange_failed&provider=${encodeURIComponent(provider)}`
    )
  }
})