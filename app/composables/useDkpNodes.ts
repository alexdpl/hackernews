import { highlightCodeDynamic } from '~/composables/useDynamicPrism'
// app/composables/useDkpNodes.ts
export function cleanNodeLabel(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

function hasToken(text: string, tokens: string[]): boolean {
  const words = text.split(/[^a-z0-9+#]+/).filter(Boolean)
  for (const t of tokens) {
    if (words.includes(t)) return true
  }
  return false
}

/**
 * Mantiene sempre le 9 Categorie Principali (come "9 Cat - 163 Nodi")
 * e risale eventualmente al nodo padre per non spezzare mai i sotto-nodi in categorie diverse.
 */
export function resolveMainCategory(node: any, allNodes: any[] = []): string {
  const dbCat = cleanNodeLabel(String(node.category || node.groupName || node.group_name || ''))
  const lowerDb = dbCat.toLowerCase()
  if (dbCat.length > 0 && lowerDb !== 'generale' && lowerDb !== 'general' && lowerDb !== 'nodi principali') {
    return dbCat
  }

  // Se è un sotto-nodo, eredita la categoria dal nodo radice (padre)
  let rootNode = node
  const visited = new Set<number>()
  while (rootNode?.parentId && !visited.has(Number(rootNode.id))) {
    visited.add(Number(rootNode.id))
    const parent = allNodes.find((n: any) => Number(n.id) === Number(rootNode.parentId))
    if (!parent) break
    rootNode = parent
  }

  const combined = `${rootNode.slug || ''} ${rootNode.name || ''} ${node.slug || ''} ${node.name || ''}`.toLowerCase()

  if (hasToken(combined, ['dkp', 'devkernel', 'devkernelpulse', 'pulse', 'meta', 'announcements', 'talks', 'feedback', 'bounties', 'bounty', 'roadmap'])) {
    return '1. DKP Ecosystem & Core'
  }
  if (hasToken(combined, ['web3', 'blockchain', 'vault', 'notary', 'crypto', 'ethereum', 'solidity', 'solana', 'defi', 'smart', 'contracts', 'token', 'nft', 'dao', 'bitcoin'])) {
    return '2. Web3, Crypto & Blockchain'
  }
  if (hasToken(combined, ['mobile', 'ios', 'android', 'flutter', 'swift', 'kotlin', 'react-native', 'expo', 'maui', 'dart', 'xcode'])) {
    return '3. Mobile Development'
  }
  if (hasToken(combined, ['ai', 'llm', 'gpt', 'claude', 'neural', 'ml', 'machine', 'deep', 'agent', 'agents', 'rag', 'ollama', 'vision', 'prompt', 'inference', 'workflows', 'automation'])) {
    return '4. AI, LLM & Neural Agents'
  }
  if (hasToken(combined, ['rust', 'linux', 'kernel', 'cpp', 'c++', 'zig', 'asm', 'os', 'embedded', 'wasm', 'compiler', 'hardware', 'riscv', 'arm'])) {
    return '5. Systems, Rust & Kernel'
  }
  if (hasToken(combined, ['web', 'nuxt', 'vue', 'react', 'ts', 'typescript', 'js', 'javascript', 'css', 'tailwind', 'node', 'frontend', 'backend', 'api', 'svelte', 'angular', 'nextjs'])) {
    return '6. Web, Frontend & Full-Stack'
  }
  if (hasToken(combined, ['cloud', 'gcp', 'aws', 'azure', 'docker', 'k8s', 'kubernetes', 'devops', 'sec', 'security', 'cyber', 'cybersecurity', 'waf', 'sentinel', 'infra', 'linux-sec', 'pentest'])) {
    return '7. Cloud, DevOps & Security'
  }
  if (hasToken(combined, ['sql', 'postgres', 'postgresql', 'neon', 'db', 'database', 'databases', 'data', 'redis', 'kafka', 'duckdb', 'analytics', 'storage'])) {
    return '8. Databases, Pure SQL & Data'
  }
  return '9. Open Source, Tech & Career'
}

/**
 * Ordina i nodi dentro ogni categoria rispettando l'albero gerarchico:
 * Padre -> Figlio (depth 1) -> Nipote (depth 2) senza mai perdere alcun nodo.
 */
export function buildCategoryNodeTree(rawNodes: any[]) {
  const normalized = rawNodes.map((n: any) => {
    const pRaw = n.parentId ?? n.parent_id ?? null
    const parentId = pRaw !== null && Number(pRaw) > 0 ? Number(pRaw) : null
    return {
      ...n,
      id: Number(n.id),
      parentId,
      name: cleanNodeLabel(n.name || n.slug),
      slug: String(n.slug || '').trim().toLowerCase()
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
 * Parser HTML sicuro (supporta tabelle, highlight, sottolineature, code blocks)
 */
export function parseDkpMarkdown(contentVal: string): string {
  try {
    if (!contentVal) return ''

    let rawContent = contentVal.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    const codeBlocks: string[] = []

    rawContent = rawContent.replace(
      /```([a-zA-Z0-9+#-]*)\r?\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string) => {
        const index = codeBlocks.length
        const cleanLang = lang ? lang.trim().toLowerCase() : ''
        const languageClass = cleanLang ? `language-${cleanLang}` : 'language-none'

        const languageLabel = cleanLang
          ? `<div class="dkp-code-header"><span>${cleanLang}</span><button type="button" class="dkp-copy-btn" data-code-id="code-block-${index}" title="Copia codice">📋</button></div>`
          : ''
        
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

        codeBlocks.push(
          `<div class="dkp-code-wrapper not-prose">${languageLabel}<pre class="dkp-code-block ${languageClass}"><code id="code-block-${index}" class="${languageClass}">${escapedCode}</code></pre></div>`
        )
        
        return `__DKP_CODE_BLOCK_${index}__`
      }
    )

    let html = rawContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Tabelle Markdown
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

    // Formattazione inline
    html = html
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="dkp-img" loading="lazy" />')
      .replace(/@\[video\]\(([^)]+)\)/g, '<div class="dkp-video-wrapper"><iframe src="$1" frameborder="0" allowfullscreen></iframe></div>')
      .replace(/==(.*?)==/g, '<mark class="dkp-highlight">$1</mark>')
      .replace(/\+\+(.*?)\+\+/g, '<u class="dkp-underline">$1</u>')
      .replace(/`([^`\n]+)`/g, '<code class="dkp-inline-code">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="dkp-link" target="_blank" rel="noopener noreferrer">$1</a>')

    // Titoli, Quote e Separatori
    html = html
      .replace(/^# (.*?)\r?$/gm, '<h1 class="dkp-h1">$1</h1>')
      .replace(/^## (.*?)\r?$/gm, '<h2 class="dkp-h2">$1</h2>')
      .replace(/^### (.*?)\r?$/gm, '<h3 class="dkp-h3">$1</h3>')
      .replace(/^&gt; (.*?)\r?$/gm, '<blockquote class="dkp-quote">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="dkp-hr" />')

    // Liste puntate e numerate
    html = html.replace(/^( {2,}|\t+)- (.*?)\r?$/gm, '<ul class="dkp-sub-list"><li class="dkp-li-nested">$2</li></ul>')
    html = html.replace(/^( {2,}|\t+)[0-9]+\. (.*?)\r?$/gm, '<ol class="dkp-sub-list"><li class="dkp-li-nested dkp-li-num">$2</li></ol>')
    html = html.replace(/^-(?!\S) (.*?)\r?$/gm, '<ul><li class="dkp-li-main">$1</li></ul>')
    html = html.replace(/^[0-9]+\. (.*?)\r?$/gm, '<ol><li class="dkp-li-main">$1</li></ol>')
    
    html = html.replace(/<\/ul>\s*<ul>/g, '')
    html = html.replace(/<\/ol>\s*<ol>/g, '')
    html = html.replace(/<\/ul>\s*<ul class="dkp-sub-list">/g, '')
    html = html.replace(/<\/ol>\s*<ol class="dkp-sub-list">/g, '')

    const lines = html.split(/\r?\n/)
    let parsedHtml = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.includes('__DKP_CODE_BLOCK_')) {
        parsedHtml += line + '\n'
      } else if (
        /^<(h[1-6]|pre|div|table|ul|ol|blockquote|hr|li|img)/.test(trimmed) ||
        /^<\/(div|table|ul|ol|blockquote)>/.test(trimmed)
      ) {
        parsedHtml += line + '\n'
      } else if (trimmed === '') {
        parsedHtml += '<br />\n'
      } else {
        parsedHtml += line + (i < lines.length - 1 ? '<br />' : '')
      }
    }

    codeBlocks.forEach((block, index) => {
      parsedHtml = parsedHtml.replace(
        new RegExp(`__DKP_CODE_BLOCK_${index}__(?:<br \\/>)?`, 'g'),
        () => block
      )
    })

    return parsedHtml
      .replace(/(<\/h[1-6]>)<br \/>/g, '$1')
      .replace(/(<\/pre>)<br \/>/g, '$1')
      .replace(/(<\/div>)<br \/>/g, '$1')
  } catch (err) {
    console.error('Errore nel parsing DKP Markdown:', err)
    return `<p class="text-red-400">Errore nella formattazione del contenuto.</p>`
  }
}