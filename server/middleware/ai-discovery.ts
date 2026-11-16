// server/middleware/ai-discovery.ts
import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'
import { DKP_CANONICAL_ORIGIN } from '~~/server/utils/dkpSeoEngine'

export default defineEventHandler((event) => {
  const method = event.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return

  const { pathname } = getRequestURL(event)

  // Escludi asset statici compilati e API interne
  if (
    pathname.startsWith('/_nuxt/') ||
    pathname.startsWith('/__nuxt') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/user/')
  ) {
    return
  }

  setResponseHeader(
    event,
    'Link',
    [
      `<${DKP_CANONICAL_ORIGIN}/llms.txt>; rel="llms-txt"; type="text/plain"`,
      `<${DKP_CANONICAL_ORIGIN}/llms-full.txt>; rel="llms-full-txt"; type="text/plain"`,
      `<${DKP_CANONICAL_ORIGIN}/ai-knowledge.json>; rel="describedby"; type="application/ld+json"`,
      `<${DKP_CANONICAL_ORIGIN}/rss.xml>; rel="alternate"; type="application/rss+xml"`
    ].join(', ')
  )
  setResponseHeader(event, 'X-DKP-Kernel', 'v2.6-PURE-SQL')
  setResponseHeader(event, 'X-AI-Attribution', `DevKernelPulse (${DKP_CANONICAL_ORIGIN})`)
})