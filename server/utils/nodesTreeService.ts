// server/utils/nodesTreeService.ts
import { sql } from 'drizzle-orm'

export function cleanNodeName(raw: unknown): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

export function cleanNodeSlug(raw: unknown): string {
  return cleanNodeName(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function wouldCreateNodeCycle(db: any, nodeId: number, candidateParentId: number | null): Promise<boolean> {
  if (!candidateParentId || candidateParentId <= 0) return false
  if (nodeId === candidateParentId) return true

  const res: any = await db.execute(sql`SELECT id, parent_id FROM nodes`)
  const rows = Array.isArray(res) ? res : (res?.rows || [])
  const parentMap = new Map<number, number | null>()
  for (const r of rows) {
    parentMap.set(Number(r.id), r.parent_id ? Number(r.parent_id) : null)
  }

  const visited = new Set<number>([nodeId])
  let cursor: number | null = candidateParentId
  while (cursor !== null) {
    if (visited.has(cursor)) return true
    visited.add(cursor)
    cursor = parentMap.get(cursor) ?? null
  }
  return false
}

interface DomainDefinition {
  category: string
  canonicalRootId?: number
  fallbackRootSlug: string
  fallbackRootName: string
  fallbackIcon: string
  fallbackColor: string
  preferredSlugs: string[]
  keywords: RegExp
}

const CANONICAL_DOMAINS: DomainDefinition[] = [
  {
    category: '1. DKP Ecosystem & Core',
    canonicalRootId: 11,
    fallbackRootSlug: 'dkp-core',
    fallbackRootName: 'DKP Ecosystem & Core',
    fallbackIcon: '⚡',
    fallbackColor: '#10b981',
    preferredSlugs: ['dkp-ecosystem-devkernelpulse', 'dkp-core', 'dkp-ecosystem'],
    keywords: /\b(dkp|devkernel|devkernelpulse|blockchain-vault|core-releases|changelog|devlog|roadmap|guide-documentazione|supporto-bug-idee|governance-partnership)\b/i
  },
  {
    category: '2. Community, Social & Forum',
    canonicalRootId: 12,
    fallbackRootSlug: 'community',
    fallbackRootName: 'Community & Forum',
    fallbackIcon: '💬',
    fallbackColor: '#a855f7',
    preferredSlugs: ['community-social-forum', 'community', 'forum', 'piazza'],
    keywords: /\b(community|social|forum|piazza|presentazioni|benvenuto|domande|aiuto|utenti|showcase|traguardi|portfolio|sfide|missioni|quest|xp|progressi|badge|collezioni|classifiche|leghe|gruppi|squadre|networking|eventi|incontri|sondaggi|votazioni|storie|percorsi|risorse|relax|gamification|progetti)\b/i
  },
  {
    category: '3. Dev, Tech & Architecture',
    canonicalRootId: 6,
    fallbackRootSlug: 'dev-architecture',
    fallbackRootName: 'Dev, Tech & Architecture',
    fallbackIcon: '🏗️',
    fallbackColor: '#38bdf8',
    preferredSlugs: ['dev-tech-code', 'dev-architecture', 'architecture', 'web-dev', 'backend', 'frontend'],
    keywords: /\b(architecture|architettura|web|nuxt|vue|nextjs|svelte|angular|frontend|backend|fullstack|api|rest|graphql|grpc|microservices|design-patterns|testing|qa|performance|ui|ux|css|tailwind|html)\b/i
  },
  {
    category: '4. AI, LLM & Neural Agents',
    canonicalRootId: 10,
    fallbackRootSlug: 'ai-agents',
    fallbackRootName: 'AI, LLM & Neural Agents',
    fallbackIcon: '🧠',
    fallbackColor: '#c084fc',
    preferredSlugs: ['llm-ai-models-ai', 'ai-agents', 'ai-llm', 'ai'],
    keywords: /\b(ai|llm|gpt|claude|gemini|neural|ml|machine|deep|agent|agents|rag|vector|ollama|vision|prompt|inference|fine-tuning|multimodal|image-generation|speech|audio|benchmarks|synthetic|alignment|workflows|automation|models|bemyagent)\b/i
  },
  {
    category: '5. Security, Cyber & Vault',
    canonicalRootId: 7,
    fallbackRootSlug: 'security',
    fallbackRootName: 'Security & Cyber Defense',
    fallbackIcon: '🛡️',
    fallbackColor: '#f43f5e',
    preferredSlugs: ['security-cyber-vault', 'security', 'cybersecurity', 'sentinel'],
    keywords: /\b(sec|security|cyber|cybersecurity|waf|sentinel|pentest|pentesting|hardening|cryptography|malware|osint|incident|response|hacking|zero-trust|trust|identity|bounty|privacy|threat|modeling|audit|sast)\b/i
  },
  {
    category: '6. Cloud, Infra & Databases',
    canonicalRootId: 8,
    fallbackRootSlug: 'cloud-infra',
    fallbackRootName: 'Cloud, Infra & Databases',
    fallbackIcon: '🗄️',
    fallbackColor: '#f59e0b',
    preferredSlugs: ['cloud-infra-db', 'cloud-infra', 'databases', 'pure-sql', 'cloud', 'devops'],
    keywords: /\b(cloud|gcp|aws|azure|docker|containers|k8s|kubernetes|devops|infra|infrastructure|serverless|cdn|networking|disaster|recovery|backup|postgres|postgresql|neon|db|database|databases|nosql|newsql|redis|caching|migration|orm|storage)\b/i
  },
  {
    category: '7. Tools, CLI & Analytics',
    canonicalRootId: 9,
    fallbackRootSlug: 'tools-cli',
    fallbackRootName: 'Tools, CLI & Analytics',
    fallbackIcon: '🛠️',
    fallbackColor: '#22d3ee',
    preferredSlugs: ['tools-analytics', 'tools-cli', 'tools', 'cli', 'analytics'],
    keywords: /\b(tools|cli|terminal|git|version-control|ide|editor|debugging|profiling|visualization|analytics|etl|pipelines|mlops|managers|deps|sdk|toolchain)\b/i
  },
  {
    category: '8. Blockchain, Web3 & DeFi',
    canonicalRootId: 34,
    fallbackRootSlug: 'web3-defi',
    fallbackRootName: 'Blockchain, Web3 & DeFi',
    fallbackIcon: '⛓️',
    fallbackColor: '#14b8a6',
    preferredSlugs: ['nblockchain-web3', 'web3-defi', 'web3', 'blockchain', 'defi', 'crypto'],
    keywords: /\b(web3|blockchain|notary|crypto|ethereum|evm|solana|defi|dex|trading|layer|bitcoin|lightning|l1|token|tokenomics|nft|dao|wallet|oracoli|interoperabilita|dapp|zero-knowledge)\b/i
  },
  {
    category: '9. Mobile & Cross-Platform',
    canonicalRootId: 35,
    fallbackRootSlug: 'mobile',
    fallbackRootName: 'Mobile & Cross-Platform',
    fallbackIcon: '📱',
    fallbackColor: '#60a5fa',
    preferredSlugs: ['nmobile-development', 'mobile', 'ios-android', 'flutter'],
    keywords: /\b(mobile|ios|android|flutter|swiftui|jetpack|react-native|expo|maui|dart|xcode|battery|push|notifications|play-store|hybrid|sensors)\b/i
  },
  {
    category: '10. Linguaggi di Programmazione',
    fallbackRootSlug: 'linguaggi-di-programmazione',
    fallbackRootName: 'Linguaggi di programmazione',
    fallbackIcon: '💻',
    fallbackColor: '#34d399',
    preferredSlugs: ['linguaggi-di-programmazione', 'languages-systems', 'programming-languages', 'languages'],
    keywords: /\b(linguaggi|programmazione|languages|typescript|javascript|react|python|django|fastapi|solidity|vyper|csharp|dotnet|aspnet|rust|go|golang|java|spring|kotlin|swift|php|laravel|ruby|rails|zig|cpp|c\+\+|asm|assembly|wasm|compiler|plpgsql|bash|powershell|kernel)\b/i
  }
]

function classifyDomain(text: string): DomainDefinition {
  // 1. Prima verifica i domini tematici specifici (AI, Security, Web3, Mobile, Languages, Cloud, Tools, Community)
  for (const d of CANONICAL_DOMAINS) {
    if (d.category === '1. DKP Ecosystem & Core' || d.category === '3. Dev, Tech & Architecture') continue
    if (d.keywords.test(text)) return d
  }
  // 2. Poi DKP Ecosystem & Core
  const dkpDomain = CANONICAL_DOMAINS.find((d) => d.category === '1. DKP Ecosystem & Core')!
  if (dkpDomain.keywords.test(text)) return dkpDomain
  // 3. Fallback su Dev, Tech & Architecture
  return CANONICAL_DOMAINS.find((d) => d.category === '3. Dev, Tech & Architecture')!
}

export async function rebuildSemanticNodesHierarchy(db: any): Promise<{
  totalNodes: number
  rootCount: number
  subCount: number
  normalizedNames: number
  relinkedParents: number
  updatedCategories: number
}> {
  await db.execute(sql`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL;`).catch(() => null)
  await db.execute(sql`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS category VARCHAR(120);`).catch(() => null)

  const res: any = await db.execute(sql`
    SELECT id, name, slug, category, parent_id
    FROM nodes
    ORDER BY id ASC
  `)
  const rows = Array.isArray(res) ? res : (res?.rows || [])
  if (!rows.length) {
    return { totalNodes: 0, rootCount: 0, subCount: 0, normalizedNames: 0, relinkedParents: 0, updatedCategories: 0 }
  }

  let normalizedNames = 0
  let relinkedParents = 0
  let updatedCategories = 0

  const items = rows.map((r: any) => {
    const rawName = String(r.name || '')
    const cleanName = cleanNodeName(rawName) || cleanNodeName(r.slug)
    const cleanSlug = cleanNodeSlug(r.slug || cleanName)
    let parentId = r.parent_id ? Number(r.parent_id) : null
    if (parentId === Number(r.id)) parentId = null
    return {
      id: Number(r.id),
      rawName,
      name: cleanName,
      slug: cleanSlug,
      category: String(r.category || '').trim(),
      parentId
    }
  })

  for (const it of items) {
    if (it.name && it.name !== it.rawName) {
      await db.execute(sql`UPDATE nodes SET name = ${it.name} WHERE id = ${it.id}`)
      normalizedNames++
    }
  }

  const byId = new Map<number, (typeof items)[number]>()
  for (const it of items) byId.set(it.id, it)

  const rootNodeByCategory = new Map<string, number>()

  for (const domain of CANONICAL_DOMAINS) {
    let chosenRootId: number | null = null

    if (domain.canonicalRootId && byId.has(domain.canonicalRootId)) {
      chosenRootId = domain.canonicalRootId
    } else {
      const bySlug = items.find((it) => domain.preferredSlugs.includes(it.slug))
      if (bySlug) {
        chosenRootId = bySlug.id
      }
    }

    if (chosenRootId) {
      rootNodeByCategory.set(domain.category, chosenRootId)
      const rootObj = byId.get(chosenRootId)
      if (rootObj) {
        if (rootObj.parentId !== null) {
          await db.execute(sql`UPDATE nodes SET parent_id = NULL WHERE id = ${chosenRootId}`)
          rootObj.parentId = null
          relinkedParents++
        }
        if (rootObj.category !== domain.category) {
          await db.execute(sql`UPDATE nodes SET category = ${domain.category} WHERE id = ${chosenRootId}`)
          rootObj.category = domain.category
          updatedCategories++
        }
      }
    }
  }

  const canonicalRootIds = new Set<number>(rootNodeByCategory.values())

  for (const it of items) {
    if (canonicalRootIds.has(it.id)) continue

    if (it.parentId !== null && it.parentId !== it.id && byId.has(it.parentId) && byId.get(it.parentId)?.parentId !== it.id) {
      const parentObj = byId.get(it.parentId)!
      if (parentObj.category && it.category !== parentObj.category) {
        await db.execute(sql`UPDATE nodes SET category = ${parentObj.category} WHERE id = ${it.id}`)
        it.category = parentObj.category
        updatedCategories++
      }
      continue
    }

    const domain = classifyDomain(`${it.category} ${it.slug} ${it.name}`)
    const targetParentId = rootNodeByCategory.get(domain.category) || null

    if (targetParentId && it.parentId !== targetParentId) {
      await db.execute(sql`UPDATE nodes SET parent_id = ${targetParentId} WHERE id = ${it.id}`)
      it.parentId = targetParentId
      relinkedParents++
    }

    if (it.category !== domain.category) {
      await db.execute(sql`UPDATE nodes SET category = ${domain.category} WHERE id = ${it.id}`)
      it.category = domain.category
      updatedCategories++
    }
  }

  const finalStatsRes: any = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE parent_id IS NULL)::int AS roots,
      COUNT(*) FILTER (WHERE parent_id IS NOT NULL)::int AS subs
    FROM nodes
  `)
  const statRow = (Array.isArray(finalStatsRes) ? finalStatsRes : (finalStatsRes?.rows || []))[0] || {}

  return {
    totalNodes: Number(statRow.total || byId.size),
    rootCount: Number(statRow.roots || canonicalRootIds.size),
    subCount: Number(statRow.subs || 0),
    normalizedNames,
    relinkedParents,
    updatedCategories
  }
}