// server/middleware/canonical-redirect.ts
import { defineEventHandler, getRequestHeader, sendRedirect, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  const host = (
    getRequestHeader(event, 'x-forwarded-host') ||
    getRequestHeader(event, 'host') ||
    ''
  )
    .split(',')[0]
    .split(':')[0]
    .trim()
    .toLowerCase()

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return
  }

  const url = event.node.req.url || '/'

  // Escludi endpoint API e healthcheck tecnici dal redirect
  if (url.startsWith('/api/') || url.startsWith('/_nuxt/')) {
    return
  }

  // Se la richiesta arriva dall'URL tecnico Cloud Run (.run.app) o da www.devkernelpulse.org -> 301 verso canonico
  const isCloudRunHost = host.endsWith('.run.app')
  const isWwwHost = host === 'www.devkernelpulse.org'

  if (isCloudRunHost || isWwwHost) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
    return sendRedirect(event, `https://devkernelpulse.org${url}`, 301)
  }
})