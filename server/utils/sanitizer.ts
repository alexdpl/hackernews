// server/utils/sanitizer.ts

/**
 * Sanitizza il contenuto HTML delle email in arrivo per prevenire attacchi XSS (Cross-Site Scripting).
 * @param rawHtml L'HTML grezzo proveniente dal webhook o dal DB
 * @returns HTML pulito e sicuro per il rendering in v-html
 */
export function sanitizeEmailHtml(rawHtml: string): string {
  if (!rawHtml) return ''

  let clean = rawHtml

  // 1. Rimuove completamente tag dannosi: <script>, <iframe>, <object>, <embed>, <form>, <base>, <link>
  clean = clean.replace(/<(script|iframe|object|embed|form|base|link)[^>]*>[\s\S]*?<\/\1>/gi, '')
  clean = clean.replace(/<(script|iframe|object|embed|form|base|link)[^>]*\/>/gi, '')

  // 2. Rimuove attributi evento inline (es. onload=..., onclick=..., onerror=...)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(['"])(.*?)\1/gi, '')
  clean = clean.replace(/\s+on[a-z]+\s*=\s*[^"'\s>]+/gi, '')

  // 3. Disinfetta attributi href e src che usano protocolli pericolosi (es. javascript:, data:text/html)
  clean = clean.replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*(['"])\s*data:text\/html[^'"]*\2/gi, '$1="#"')

  // 4. Aggiunge target="_blank" e rel="noopener noreferrer" a tutti i link visibili per sicurezza sandbox
  clean = clean.replace(/<a\s+(?:[^>]*?\s+)?href=/gi, '<a target="_blank" rel="noopener noreferrer" href=')

  return clean
}