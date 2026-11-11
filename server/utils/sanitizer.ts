// server/utils/sanitizer.ts
import sanitizeHtml from 'sanitize-html'
import type { IOptions } from 'sanitize-html'

/**
 * Helper per l'interoperabilità CJS/ESM di sanitize-html in Nitro Server Engine & Vite
 */
function getSanitizer(): typeof sanitizeHtml {
  return typeof sanitizeHtml === 'function'
    ? sanitizeHtml
    : (sanitizeHtml as any)?.default || sanitizeHtml
}

/**
 * Configurazione opzioni sanitize-html per le email ed i contenuti HTML in arrivo
 */
const EMAIL_SANITY_OPTIONS: IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  }
}

/**
 * 1. Sanitizzatore HTML per Email e Contenuti (Prevenzione XSS)
 */
export function sanitizeEmailHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''

  try {
    const sanitize = getSanitizer()
    return sanitize(rawHtml, EMAIL_SANITY_OPTIONS)
  } catch (err) {
    console.error('[SANITIZER ERROR]: Fallback attivo per sanificazione HTML', err)
    
    // Fallback sicuro con sanitizzazione regex iterativa dei tag script ed event handler
    let sanitized = rawHtml
    let previous: string
    do {
      previous = sanitized
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
    } while (sanitized !== previous)

    return sanitized
  }
}

/**
 * Alias per la sanitizzazione generica dei contenuti (retrocompatibilità frontend/backend)
 */
export function sanitizeContent(rawHtml: string | null | undefined): string {
  return sanitizeEmailHtml(rawHtml)
}

/**
 * 2. Sanitizzatore Supremo per URL (v2.6-BULLETPROOF)
 * Garantisce che nessun URL malformato, vuoto, oggetto o anomalo faccia mai crashare il server.
 */
export function sanitizeUrl(
  rawUrl: string | null | undefined, 
  fallbackTitle?: string | null | undefined
): { url: string; domain: string; isInternal: boolean } {
  const defaultDomain = 'devkernelpulse.org'
  
  const safeTitleString = typeof fallbackTitle === 'string' && fallbackTitle.trim() !== '' 
    ? fallbackTitle 
    : 'tech-story'

  const fallbackSlug = safeTitleString
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || Math.random().toString(36).substring(2, 8)

  const defaultInternalUrl = `https://${defaultDomain}/item/${fallbackSlug}`

  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return {
      url: defaultInternalUrl,
      domain: defaultDomain,
      isInternal: true
    }
  }

  let cleaned = rawUrl.trim()

  // Link relativi di HackerNews (es. "item?id=12345" o "/item?id=12345")
  if (cleaned.includes('item?id=') || cleaned.startsWith('/item/')) {
    const idMatch = cleaned.match(/id=(\d+)/)
    const hnId = idMatch ? idMatch[1] : ''
    return {
      url: hnId ? `https://news.ycombinator.com/item?id=${hnId}` : `https://news.ycombinator.com`,
      domain: 'ycombinator.com',
      isInternal: false
    }
  }

  // Manca il protocollo ma sembra un dominio valido
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    if (cleaned.startsWith('www.') || (cleaned.includes('.') && !cleaned.includes(' '))) {
      cleaned = `https://${cleaned}`
    } else {
      return {
        url: `https://${defaultDomain}/ask/${fallbackSlug}`,
        domain: defaultDomain,
        isInternal: true
      }
    }
  }

  try {
    const parsed = new URL(cleaned)
    return {
      url: parsed.toString(),
      domain: parsed.hostname ? parsed.hostname.replace(/^www\./, '') : defaultDomain,
      isInternal: false
    }
  } catch {
    return {
      url: defaultInternalUrl,
      domain: defaultDomain,
      isInternal: true
    }
  }
}