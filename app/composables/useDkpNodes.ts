// app/composables/useDkpNodes.ts
export function cleanNodeLabel(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

export function slugifyNodeText(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

export function buildNodeThreadSlug(id: number | string, title?: string): string {
  const cleanId = String(id || '').replace(/^blog-/, '').trim()
  const slugPart = slugifyNodeText(title || '')
  if (!cleanId) return slugPart || 'thread'
  if (/^\d+$/.test(cleanId)) {
    return slugPart ? `${cleanId}-${slugPart}` : cleanId
  }
  return cleanId
}

export function extractNodeThreadId(idOrSlug: string): number {
  const clean = String(idOrSlug || '').trim()
  const match = clean.match(/^(\d+)(?:-|$)/)
  return match ? Number(match[1]) : 0
}

function hasToken(text: string, tokens: string[]): boolean {
  const words = text.split(/[^a-z0-9àèéìòù+#]+/).filter(Boolean)
  for (const t of tokens) {
    if (words.includes(t)) return true
  }
  return false
}

export function resolveMainCategory(node: any, allNodes: any[] = []): string {
  const dbCat = cleanNodeLabel(String(node.category || node.groupName || node.group_name || ''))
  const lowerDb = dbCat.toLowerCase()
  if (dbCat.length > 0 && lowerDb !== 'generale' && lowerDb !== 'general' && lowerDb !== 'nodi principali') {
    return dbCat
  }

  let rootNode = node
  const visited = new Set<number>()
  while (rootNode?.parentId && !visited.has(Number(rootNode.id))) {
    visited.add(Number(rootNode.id))
    const parent = allNodes.find((n: any) => Number(n.id) === Number(rootNode.parentId))
    if (!parent) break
    rootNode = parent
  }

  const rootId = Number(rootNode?.id || 0)
  if (rootId === 11) return '1. DKP Ecosystem & Core'
  if (rootId === 12) return '2. Community, Social & Forum'
  if (rootId === 6) return '3. Dev, Tech & Architecture'
  if (rootId === 10) return '4. AI, LLM & Neural Agents'
  if (rootId === 7) return '5. Security, Cyber & Vault'
  if (rootId === 8) return '6. Cloud, Infra & Databases'
  if (rootId === 9) return '7. Tools, CLI & Analytics'
  if (rootId === 34) return '8. Blockchain, Web3 & DeFi'
  if (rootId === 35) return '9. Mobile & Cross-Platform'

  const combined = `${rootNode.slug || ''} ${rootNode.name || ''} ${node.slug || ''} ${node.name || ''}`.toLowerCase()

  if (hasToken(combined, [
    'dkp', 'devkernel', 'devkernelpulse', 'pulse', 'meta', 'announcements', 'annunci',
    'aggiornamenti', 'release', 'releases', 'devlog', 'roadmap', 'bug', 'supporto',
    'guide', 'documentazione', 'moderazione', 'changelog', 'governance', 'partnership', 'idee'
  ])) {
    return '1. DKP Ecosystem & Core'
  }
  if (hasToken(combined, [
    'community', 'social', 'forum', 'piazza', 'presentazioni', 'benvenuto', 'domande',
    'aiuto', 'utenti', 'showcase', 'traguardi', 'portfolio', 'sfide', 'missioni', 'quest',
    'xp', 'progressi', 'badge', 'collezioni', 'classifiche', 'leghe', 'gruppi', 'squadre',
    'networking', 'eventi', 'incontri', 'sondaggi', 'votazioni', 'storie', 'percorsi',
    'risorse', 'relax', 'gamification', 'progetti'
  ])) {
    return '2. Community, Social & Forum'
  }
  if (hasToken(combined, [
    'languages', 'rust', 'go', 'golang', 'python', 'javascript', 'typescript', 'cpp',
    'c++', 'zig', 'asm', 'linux', 'unix', 'kernel', 'os', 'embedded', 'iot', 'wasm',
    'compiler', 'toolchain', 'build', 'hardware', 'riscv', 'arm'
  ])) {
    return '10. Programming Languages & Systems'
  }
  if (hasToken(combined, [
    'web3', 'blockchain', 'vault', 'notary', 'crypto', 'ethereum', 'evm', 'solidity',
    'solana', 'defi', 'dex', 'trading', 'layer', 'bitcoin', 'lightning', 'l1', 'token',
    'tokenomics', 'nft', 'dao', 'wallet', 'oracoli', 'interoperabilità', 'dapp', 'zero', 'knowledge'
  ])) {
    return '8. Blockchain, Web3 & DeFi'
  }
  if (hasToken(combined, [
    'mobile', 'ios', 'android', 'flutter', 'swift', 'swiftui', 'kotlin', 'jetpack',
    'react-native', 'expo', 'maui', 'dart', 'xcode', 'battery', 'push', 'notifications',
    'play', 'store', 'hybrid', 'sensors'
  ])) {
    return '9. Mobile & Cross-Platform'
  }
  if (hasToken(combined, [
    'ai', 'llm', 'gpt', 'claude', 'neural', 'ml', 'machine', 'deep', 'agent', 'agents',
    'rag', 'vector', 'ollama', 'vision', 'prompt', 'inference', 'fine', 'tuning',
    'multimodal', 'image', 'generation', 'speech', 'audio', 'benchmarks', 'synthetic',
    'alignment', 'workflows', 'automation', 'models'
  ])) {
    return '4. AI, LLM & Neural Agents'
  }
  if (hasToken(combined, [
    'sec', 'security', 'cyber', 'cybersecurity', 'waf', 'sentinel', 'pentest', 'pentesting',
    'hardening', 'cryptography', 'malware', 'osint', 'incident', 'response', 'hacking',
    'zero-trust', 'trust', 'identity', 'bounty', 'privacy', 'threat', 'modeling', 'audit'
  ])) {
    return '5. Security, Cyber & Vault'
  }
  if (hasToken(combined, [
    'cloud', 'gcp', 'aws', 'azure', 'docker', 'containers', 'k8s', 'kubernetes', 'devops',
    'infra', 'infrastructure', 'serverless', 'cdn', 'networking', 'disaster', 'recovery',
    'backup', 'sql', 'postgres', 'postgresql', 'neon', 'db', 'database', 'databases',
    'nosql', 'newsql', 'redis', 'caching', 'migration', 'orm', 'storage'
  ])) {
    return '6. Cloud, Infra & Databases'
  }
  if (hasToken(combined, [
    'tools', 'cli', 'terminal', 'git', 'version', 'control', 'ide', 'editor', 'debugging',
    'profiling', 'visualization', 'analytics', 'etl', 'pipelines', 'mlops', 'managers', 'deps'
  ])) {
    return '7. Tools, CLI & Analytics'
  }
  return '3. Dev, Tech & Architecture'
}

export function buildCategoryNodeTree(rawNodes: any[]) {
  const normalized = rawNodes.map((n: any) => {
    const pRaw = n.parentId ?? n.parent_id ?? null
    const parentId = pRaw !== null && Number(pRaw) > 0 ? Number(pRaw) : null
    return {
      ...n,
      id: Number(n.id),
      parentId,
      name: cleanNodeLabel(n.name || n.slug),
      slug: String(n.slug || '').replace(/^(n\/)+/i, '').trim().toLowerCase()
    }
  })

  const byId = new Map<number, any>()
  for (const n of normalized) byId.set(n.id, n)

  const grouped: Record<string, any[]> = {}
  for (const n of normalized) {
    const cat = resolveMainCategory(n, normalized)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(n)
  }

  const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))
  const orderedGrouped: Record<string, any[]> = {}

  for (const cat of sortedCategories) {
    const list = grouped[cat]
    const catIds = new Set(list.map((n) => n.id))
    const childrenMap = new Map<number, any[]>()

    for (const item of list) {
      if (item.parentId && catIds.has(item.parentId)) {
        if (!childrenMap.has(item.parentId)) childrenMap.set(item.parentId, [])
        childrenMap.get(item.parentId)!.push(item)
      }
    }

    const flattened: any[] = []
    const visited = new Set<number>()

    function walk(node: any, depth: number) {
      if (visited.has(node.id)) return
      visited.add(node.id)
      const directChildren = childrenMap.get(node.id) || []
      flattened.push({
        ...node,
        depth,
        subNodesCount: directChildren.length,
        parentName: node.parentId ? byId.get(node.parentId)?.name || null : null
      })
      for (const child of directChildren) {
        walk(child, depth + 1)
      }
    }

    for (const item of list) {
      if (!item.parentId || !catIds.has(item.parentId)) {
        walk(item, 0)
      }
    }
    for (const item of list) {
      if (!visited.has(item.id)) {
        walk(item, 0)
      }
    }

    orderedGrouped[cat] = flattened
  }

  return {
    nodes: normalized,
    categories: sortedCategories,
    groupedNodes: orderedGrouped
  }
}

/**
 * Parser Markdown & HTML condiviso tra Nodes, Blog ed Editor:
 * - Protegge code blocks (multi-riga e inline) senza lasciare backtick residui in <code>
 * - Raggruppa liste puntate (<ul>) e numerate (<ol>) in modo continuo
 */
export function parseDkpMarkdown(contentVal: string): string {
  try {
    if (!contentVal) return ''

    let rawContent = String(contentVal).replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    const codeBlocks: string[] = []
    const inlineCodes: string[] = []

    const makeInlineCode = (code: string) => {
      const idx = inlineCodes.length
      const stripped = String(code || '').replace(/^`+|`+$/g, '').trim()
      const escaped = stripped
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      inlineCodes.push(`<code class="dkp-inline-code">${escaped}</code>`)
      return `__DKP_INLINE_CODE_${idx}__`
    }

    // 1. Proteggi blocchi di codice ```lang ... ```
    rawContent = rawContent.replace(
      /```([a-zA-Z0-9_+#.-]*)[ \t]*\r?\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string) => {
        const index = codeBlocks.length
        const cleanLang = lang ? lang.trim().toLowerCase() : ''
        const languageClass = cleanLang ? `language-${cleanLang}` : 'language-none'

        const displayLang = cleanLang || 'code'
        const languageLabel = `<div class="dkp-code-header"><span>${displayLang}</span><button type="button" class="dkp-copy-btn" data-code-id="code-block-${index}" title="Copia codice">&#128203; Copia</button></div>`

        const cleanCode = String(code || '').replace(/^`+|`+$/g, '')
        const escapedCode = cleanCode
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

        codeBlocks.push(
          `<div class="dkp-code-wrapper not-prose">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code id="code-block-${index}" class="${languageClass}">${escapedCode}</code></pre></div>`
        )

        return `__DKP_CODE_BLOCK_${index}__`
      }
    )

    // 2. Proteggi codice inline (triplo su riga singola, doppio ``...``, singolo `...` o <code> già presente)
    rawContent = rawContent.replace(/```([^`\n]+)```/g, (_m, c) => makeInlineCode(c))
    rawContent = rawContent.replace(/``([^`\n]+(?:`[^`\n]+)*)``/g, (_m, c) => makeInlineCode(c))
    rawContent = rawContent.replace(/`([^`\n]+)`/g, (_m, c) => makeInlineCode(c))
    rawContent = rawContent.replace(/<code[^>]*>`*([^<`]+)`*<\/code>/gi, (_m, c) => makeInlineCode(c))

    // 3. Escape HTML residuo
    let html = rawContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // 4. Tabelle Markdown
    html = html.replace(/^\|(.+)\|$/gm, (_match, p1) => {
      const cells = p1.split('|').map((c: string) => c.trim())
      if (cells.every((c: string) => /^:?-+:?$/.test(c))) return ''
      const rowHtml = cells.map((c: string) => `<td>${c}</td>`).join('')
      return `<tr>${rowHtml}</tr>`
    })
    html = html.replace(/(<tr>.*?<\/tr>[\s\n\r]*)+/g, (match) => {
      const cleanRows = match.replace(/[\n\r]+/g, '')
      return `<div class="dkp-table-wrapper"><table class="dkp-table"><tbody>${cleanRows}</tbody></table></div>`
    })

    // 5. Formattazione inline e titoli
    html = html
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
      .replace(/@\[video\]\(([^)]+)\)/g, '<div class="dkp-video-wrapper"><iframe src="$1" frameborder="0" allowfullscreen></iframe></div>')
      .replace(/==([^=\n]+)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+([^+\n]+)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="dkp-bold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="dkp-italic">$1</em>')
      .replace(/~~([^~]+)~~/g, '<del class="dkp-strike">$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />')

    // 6. Raggruppamento continuo di liste puntate (<ul>) e numerate (<ol>)
    const lines = html.split(/\r?\n/)
    const output: string[] = []
    let listType: 'ul' | 'ol' | null = null

    const closeList = () => {
      if (listType) {
        output.push(`</${listType}>`)
        listType = null
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      const subBullet = line.match(/^(?:\s{2,}|\t+)[-*•]\s+(.*)$/)
      const subNumber = line.match(/^(?:\s{2,}|\t+)\d+[.)]\s+(.*)$/)
      const mainBullet = line.match(/^\s?[-*•]\s+(.*)$/)
      const mainNumber = line.match(/^\s?\d+[.)]\s+(.*)$/)

      if (subBullet || mainBullet) {
        const itemText = subBullet ? subBullet[1] : mainBullet![1]
        const liClass = subBullet ? 'dkp-li-nested ml-5' : 'dkp-li-main'
        if (listType !== 'ul') {
          closeList()
          listType = 'ul'
          output.push('<ul class="dkp-main-list list-disc pl-6 my-2.5 space-y-1.5">')
        }
        output.push(`<li class="${liClass}">${itemText}</li>`)
        continue
      }

      if (subNumber || mainNumber) {
        const itemText = subNumber ? subNumber[1] : mainNumber![1]
        const liClass = subNumber ? 'dkp-li-nested dkp-li-num ml-5' : 'dkp-li-main'
        if (listType !== 'ol') {
          closeList()
          listType = 'ol'
          output.push('<ol class="dkp-main-list list-decimal pl-6 my-2.5 space-y-1.5">')
        }
        output.push(`<li class="${liClass}">${itemText}</li>`)
        continue
      }

      closeList()

      if (trimmed.includes('__DKP_CODE_BLOCK_')) {
        output.push(line)
      } else if (/^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) || /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)) {
        output.push(line)
      } else if (trimmed === '') {
        output.push('<br />')
      } else {
        output.push(`${line}${i < lines.length - 1 ? '<br />' : ''}`)
      }
    }
    closeList()

    let parsedHtml = output.join('\n')

    // 7. Reinserisci inline code e code blocks protetti eliminando qualsiasi apice residuo
    inlineCodes.forEach((snippet, index) => {
      parsedHtml = parsedHtml.replace(new RegExp(`\`*__DKP_INLINE_CODE_${index}__\`*`, 'g'), () => snippet)
    })

    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'), () => block)
    })

    return parsedHtml
      .replace(/(<code\b[^>]*>)`+/gi, '$1')
      .replace(/`+(<\/code>)/gi, '$1')
      .replace(/(<\/h[1-6]>)<br \/>/g, '$1')
      .replace(/(<\/div>)<br \/>/g, '$1')
      .replace(/(<\/ul>)<br \/>/g, '$1')
      .replace(/(<\/ol>)<br \/>/g, '$1')
  } catch (err) {
    console.error('[parseDkpMarkdown error]:', err)
    return String(contentVal || '')
  }
}