// server/utils/sanitizer.ts

/**
 * 1. Sanitizzatore Supremo per URL (v2.5-GOLD - Bulletproof Edition)
 * Garantisce che nessun URL malformato, vuoto o anomalo faccia mai crashare il server.
 * Intercetta link relativi di HackerNews, stringhe sporche e applica fallback interni sicuri.
 */
export function sanitizeUrl(rawUrl: string | null | undefined, fallbackTitle?: string): { url: string; domain: string; isInternal: boolean } {
  const defaultDomain = 'devkernelpulse.org'
  
  // Genera uno slug sicuro dal titolo
  const fallbackSlug = fallbackTitle 
    ? String(fallbackTitle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') 
    : Math.random().toString(36).substring(2, 8)

  const defaultInternalUrl = `https://${defaultDomain}/item/${fallbackSlug}`

  // Se l'URL è vuoto, null o non è una stringa
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return {
      url: defaultInternalUrl,
      domain: defaultDomain,
      isInternal: true
    }
  }

  let cleaned = rawUrl.trim()

  // Se è un link relativo di HackerNews (es. "item?id=12345" o "/item?id=12345")
  if (cleaned.includes('item?id=') || cleaned.startsWith('/item/')) {
    const idMatch = cleaned.match(/id=(\d+)/)
    const hnId = idMatch ? idMatch[1] : ''
    return {
      url: hnId ? `https://news.ycombinator.com/item?id=${hnId}` : `https://news.ycombinator.com`,
      domain: 'ycombinator.com',
      isInternal: false
    }
  }

  // Se manca il protocollo ma sembra un dominio valido
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

  // Tentativo di parsing nativo protetto al 100% da try/catch
  try {
    const parsed = new URL(cleaned)
    return {
      url: parsed.toString(),
      domain: parsed.hostname.replace(/^www\./, ''),
      isInternal: false
    }
  } catch (err) {
    // Fallback di sicurezza estrema: se il costruttore lancia Invalid URL, lo catturiamo qui
    return {
      url: defaultInternalUrl,
      domain: defaultDomain,
      isInternal: true
    }
  }
}

/**
 * 2. Sanitizzatore HTML per Email in arrivo (Prevenzione XSS / Cross-Site Scripting)
 */
export function sanitizeEmailHtml(rawHtml: string): string {
  if (!rawHtml) return ''

  return sanitizeHtml(rawHtml, {
	  disallowedTagsMode: 'discard',
	  allowedSchemes: ['http', 'https', 'mailto'],
	  allowedSchemesAppliedToAttributes: ['href', 'src'],
	  allowProtocolRelative: false,
	  transformTags: {
  a: sanitizeHtml.simpleTransform('a', { target: '_blank',
  rel: 'noopener noreferrer' }, true) }
  })
  
}