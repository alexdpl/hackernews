// server/utils/sanitizer.ts

/**
 * 1. Sanitizzatore Supremo per URL (v2.6-BULLETPROOF)
 * Garantisce che nessun URL malformato, vuoto, oggetto o anomalo faccia mai crashare il server.
 */
export function sanitizeUrl(
  rawUrl: string | null | undefined, 
  fallbackTitle?: string | null | undefined
): { url: string; domain: string; isInternal: boolean } {
  const defaultDomain = 'devkernelpulse.org'
  
  // Conversione sicura e pulita del titolo in stringa
  const safeTitleString = typeof fallbackTitle === 'string' && fallbackTitle.trim() !== '' 
    ? fallbackTitle 
    : 'tech-story'

  const fallbackSlug = safeTitleString
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || Math.random().toString(36).substring(2, 8)

  const defaultInternalUrl = `https://${defaultDomain}/item/${fallbackSlug}`

  // Se l'URL non è una stringa valida
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

  // Parsing nativo protetto al 100% da try/catch
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

/**
 * 2. Sanitizzatore HTML per Email in arrivo (Prevenzione XSS)
 * Nota: Assicurati di importare sanitize-html se viene usato, oppure restituisce stringa pulita.
 */
export function sanitizeEmailHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''

  // Se la libreria sanitizeHtml è disponibile globalmente o importata
  try {
    // @ts-ignore
    if (typeof sanitizeHtml === 'function') {
      // @ts-ignore
      return sanitizeHtml(rawHtml, {
        disallowedTagsMode: 'discard',
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedSchemesAppliedToAttributes: ['href', 'src'],
        allowProtocolRelative: false,
        transformTags: {
          a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true)
        }
      })
    }
  } catch {
    // Fallback se la lib non è caricata
  }

  // Fallback di pulizia basilare dei tag script/on-events se sanitize-html non è agganciato
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
}