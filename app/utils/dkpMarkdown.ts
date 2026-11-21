// app/utils/dkpMarkdown.ts

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function safeUrl(raw: string): string {
  const normalized = String(raw || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

  // Blocca stringhe vuote, spazi o caratteri di controllo
  if (!normalized || /[\u0000-\u001F\u007F\s]/.test(normalized)) {
    return '#'
  }

  // Consenti solo http://, https:// o percorsi relativi interni (/...)
  if (/^https?:\/\//i.test(normalized) || /^\/(?!\/)/.test(normalized)) {
    return normalized
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  return '#'
}

function renderMarkdownTables(text: string): string {
  const tableRegex =
    /^(\|.+\|)\r?\n(\|[ \t:|-]+\|)\r?\n((?:\|.+\|(?:\r?\n|$))+)/gm

  return text.replace(tableRegex, (_match, headerLine: string, _alignLine: string, bodyBlock: string) => {
    const parseRow = (row: string) =>
      row
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((cell) => cell.trim())

    const headers = parseRow(headerLine)
    const rows = bodyBlock
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map(parseRow)

    const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`
    const tbody = `<tbody>${rows
      .map((cols) => `<tr>${headers.map((_, idx) => `<td>${cols[idx] ?? ''}</td>`).join('')}</tr>`)
      .join('')}</tbody>`

    return `<div class="dkp-table-wrapper not-prose"><table class="dkp-table">${thead}${tbody}</table></div>\n`
  })
}

export function parseDkpMarkdown(contentVal: string): string {
  try {
    if (!contentVal) return ''

    let rawContent = String(contentVal).replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    const codeBlocks: string[] = []
    const inlineCodes: string[] = []

    // 1. Isola i blocchi di codice fenced (```lang ... ```)
    rawContent = rawContent.replace(
      /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string) => {
        const index = codeBlocks.length
        const cleanLang = lang ? lang.replace(/[^a-zA-Z0-9+#-]/g, '').toLowerCase() : 'code'
        const languageClass = cleanLang && cleanLang !== 'code' ? `language-${cleanLang}` : 'language-none'

        const languageLabel = `<div class="dkp-code-header"><span>${cleanLang || 'code'}</span><button type="button" class="dkp-copy-btn" data-code-id="code-block-${index}" title="Copia codice">&#128203; Copia</button></div>`
        const escapedCode = escapeHtml(code)

        codeBlocks.push(
          `<div class="dkp-code-wrapper not-prose">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code id="code-block-${index}" class="${languageClass}">${escapedCode}</code></pre></div>`
        )
        return `__DKP_CODE_BLOCK_${index}__`
      }
    )

    // 2. Isola il codice inline (`...`) prima dell'escape/formattazione
    rawContent = rawContent.replace(/`([^`\n]+)`/g, (_match: string, code: string) => {
      const index = inlineCodes.length
      inlineCodes.push(`<code class="dkp-inline-code">${escapeHtml(code)}</code>`)
      return `__DKP_INLINE_CODE_${index}__`
    })

    // 3. Escape HTML completo su tutto il resto del testo (inclusi " e ')
    let html = escapeHtml(rawContent)

    // 4. Tabelle Markdown
    html = renderMarkdownTables(html)

    // 5. Immagini e Link con validazione protocollo (anti-XSS)
    html = html
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_m, alt: string, src: string) =>
          `<img src="${safeUrl(src)}" alt="${alt}" class="dkp-img" loading="lazy" />`
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_m, label: string, href: string) =>
          `<a href="${safeUrl(href)}" class="dkp-link" target="_blank" rel="noopener noreferrer">${label}</a>`
      )

    // 6. Formattazione inline
    html = html
      .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')

    // 7. Intestazioni, citazioni, separatori e liste
    html = html
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />')
      .replace(/^(?:[-*]) (.+)\r?$/gm, '<li class="dkp-li">$1</li>')
      .replace(/^\d+\. (.+)\r?$/gm, '<li class="dkp-li-ordered">$1</li>')

    // Raggruppa <li> consecutivi in <ul> / <ol>
    html = html
      .replace(/((?:<li class="dkp-li">.*<\/li>\n?)+)/g, '<ul class="dkp-ul">$1</ul>\n')
      .replace(/((?:<li class="dkp-li-ordered">.*<\/li>\n?)+)/g, '<ol class="dkp-ol">$1</ol>\n')

    // 8. Gestione a capo sicura fuori dai tag block-level
    const lines = html.split(/\r?\n/)
    let parsedHtml = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.includes('__DKP_CODE_BLOCK_')) {
        parsedHtml += line + '\n'
      } else if (
        /^<(h[1-6]|pre|div|table|thead|tbody|tr|th|td|ul|ol|li|blockquote|hr|img)/.test(trimmed) ||
        /^<\/(div|table|thead|tbody|tr|ul|ol|blockquote)>/.test(trimmed)
      ) {
        parsedHtml += line + '\n'
      } else if (trimmed === '') {
        parsedHtml += '<br />\n'
      } else {
        parsedHtml += line + (i < lines.length - 1 ? '<br />' : '')
      }
    }

    // 9. Ripristina codice inline e blocchi di codice
    inlineCodes.forEach((snippet, index) => {
      parsedHtml = parsedHtml.replace(new RegExp(`__DKP_INLINE_CODE_${index}__`, 'g'), () => snippet)
    })

    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(
        new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'),
        () => block
      )
    })

    return parsedHtml
  } catch (err) {
    console.error('Errore nel parsing DKP Markdown:', err)
    return '<p class="text-rose-400">Errore nella formattazione del contenuto.</p>'
  }
}