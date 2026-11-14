// server/middleware/subdomain-mail.ts
import { defineEventHandler, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  const host = (getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || '').toLowerCase()
  const origin = getRequestHeader(event, 'origin') || ''

  // CORS Cross-Subdomain (devkernelpulse.org <-> mail.devkernelpulse.org <-> api.devkernelpulse.org)
  const allowedOrigins = [
    'https://devkernelpulse.org',
    'https://www.devkernelpulse.org',
    'https://mail.devkernelpulse.org',
    'https://api.devkernelpulse.org',
    'http://localhost:3000'
  ]

  if (allowedOrigins.includes(origin)) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  }

  if (event.method === 'OPTIONS' && host.startsWith('mail.')) {
    setResponseStatus(event, 204)
    return ''
  }

  // Attiva routing dedicato solo quando Host è mail.devkernelpulse.org
  if (!host.startsWith('mail.')) return

  setResponseHeader(event, 'X-DKP-Mail-Node', 'NEXUS-ONLINE')
  setResponseHeader(event, 'X-DKP-Kernel', 'v2.6-PURE-SQL')

  const rawUrl = event.node.req.url || '/'
  const [pathname, search = ''] = rawUrl.split('?')
  const qs = search ? `?${search}` : ''

  // Healthcheck dedicato del Mail Server (usato dal badge telemetria)
  if (pathname === '/health' || pathname === '/api/health') {
    setResponseHeader(event, 'Content-Type', 'application/json')
    return {
      success: true,
      status: 'NEXUS_ONLINE',
      node: 'mail.devkernelpulse.org',
      version: 'v2.6-PURE-SQL',
      timestamp: new Date().toISOString()
    }
  }

  // Rewrite interno trasparente (zero 301/302 redirect) per le rotte del Mail Server
  const rewriteMap: Record<string, string> = {
    '/': '/admin/mail',
    '/mail': '/admin/mail',
    '/newsletter': '/admin/newsletter',
    '/autoresponder': '/admin/autoresponder',
    '/webhook/inbound': '/api/admin/mail/inbound'
  }

  if (rewriteMap[pathname]) {
    event.node.req.url = `${rewriteMap[pathname]}${qs}`
  }
})