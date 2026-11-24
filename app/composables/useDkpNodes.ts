import { parseDkpMarkdown } from '~/utils/dkpMarkdown'
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
