// server/routes/llms-full.txt.ts
import { defineEventHandler, setResponseHeaders } from 'h3'
import {
  DKP_CANONICAL_ORIGIN,
  fetchIndexableDkpContent
} from '~~/server/utils/dkpSeoEngine'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'X-DKP-Kernel': 'v2.6-PURE-SQL'
  })

  const { posts, nodes, threads } = await fetchIndexableDkpContent()
  const nowIso = new Date().toISOString()

  const sections: string[] = [
    '# DevKernelPulse (DKP) — Complete Technical Corpus & Knowledge Base (v2.6-PURE-SQL)',
    `Generated at: ${nowIso}`,
    `Canonical URL: ${DKP_CANONICAL_ORIGIN}`,
    '',
    '================================================================================',
    '1. SYSTEM ARCHITECTURE & CORE CAPABILITIES (v2.6-PURE-SQL)',
    '================================================================================',
    '- **Runtime & Framework**: Nuxt 4 + Nitro Server Engine deployato su Google Cloud Run (managed container, zero legacy ORM).',
    '- **Database Layer**: Neon Serverless PostgreSQL interrogato esclusivamente tramite query SQL parametriche pure (`Pure-SQL v2.6`), con schema auto-migrativo idempotente.',
    '- **AI Trinity Gateway & OpenUI Studio**: Orchestrazione multi-modello via OpenRouter (DKP-Flash, DKP-Coder, DKP-Pro) con generazione UI interattiva in tempo reale e API Key metering (`dkp_live_`).',
    '- **Pulse Sentinel SAST**: Motore di analisi statica della sicurezza e firewall AI con output JSON deterministico (`strict: true`).',
    '- **Proof of Code Vault & Blockchain Ledger**: Notarizzazione SHA-256 concatenata e Merkle Root verificabile pubblicamente per articoli tecnici, snippet e thread del forum.',
    '- **DKP Self-Serve Ads & Affiliate Network**: Motore ibrido Click + Impressioni con rotazione equa su nodi, feed e sidebar.',
    '',
    '================================================================================',
    `2. ENGINEERING BLOG ARTICLES (${posts.length} pubblicati)`,
    '================================================================================'
  ]

  if (posts.length === 0) {
    sections.push('Nessun articolo pubblicato trovato al momento.')
  } else {
    for (const post of posts) {
      sections.push(
        `### ${post.title}`,
        `- URL: ${post.url}`,
        `- Autore: ${post.author}`,
        `- Categoria: ${post.category}`,
        `- Aggiornato: ${post.updatedAt}`,
        ...(post.notarizationHash ? [`- Proof of Code SHA-256: ${post.notarizationHash}`] : []),
        `- Sommario: ${post.description}`,
        ''
      )
    }
  }

  sections.push(
    '================================================================================',
    `3. COMMUNITY NODES (${nodes.length} attivi)`,
    '================================================================================'
  )

  for (const node of nodes) {
    sections.push(`- **${node.title}** (${node.url}): ${node.description}`)
  }

  sections.push(
    '',
    '================================================================================',
    `4. FORUM DISCUSSIONS & TECHNICAL THREADS (${threads.length} indicizzati)`,
    '================================================================================'
  )

  for (const thread of threads.slice(0, 150)) {
    sections.push(
      `### ${thread.title}`,
      `- URL: ${thread.url}`,
      `- Nodo: ${thread.category} | Autore: ${thread.author} | Data: ${thread.updatedAt}`,
      ...(thread.notarizationHash ? [`- Proof of Code SHA-256: ${thread.notarizationHash}`] : []),
      `- Estratto: ${thread.description}`,
      ''
    )
  }

  return sections.join('\n')
})