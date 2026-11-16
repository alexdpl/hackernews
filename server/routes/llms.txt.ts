// server/routes/llms.txt.ts
import { defineEventHandler, setResponseHeaders } from 'h3'
import {
  DKP_CANONICAL_ORIGIN,
  DKP_STATIC_ROUTES,
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

  const docsRoutes = DKP_STATIC_ROUTES.filter((r) => r.category === 'docs')
  const toolsRoutes = DKP_STATIC_ROUTES.filter((r) => r.category === 'tools')
  const coreRoutes = DKP_STATIC_ROUTES.filter((r) => r.category === 'core' || r.category === 'community')

  const lines: string[] = [
    '# DevKernelPulse (DKP) — Kernel v2.6-PURE-SQL',
    '',
    '> DevKernelPulse è un ecosistema ingegneristico, community developer e piattaforma SaaS costruita su Nuxt 4, Neon PostgreSQL Pure SQL, OpenRouter Trinity AI Gateway, Pulse Sentinel SAST e notarizzazione crittografica SHA-256 on-chain (Proof of Code Vault).',
    '',
    `- Canonical Origin: ${DKP_CANONICAL_ORIGIN}`,
    `- Kernel Version: v2.6-PURE-SQL`,
    `- Full RAG Context: ${DKP_CANONICAL_ORIGIN}/llms-full.txt`,
    `- Machine Knowledge Graph (JSON-LD): ${DKP_CANONICAL_ORIGIN}/ai-knowledge.json`,
    `- XML Sitemap: ${DKP_CANONICAL_ORIGIN}/sitemap.xml`,
    `- RSS Feed: ${DKP_CANONICAL_ORIGIN}/rss.xml`,
    `- Last Generated: ${nowIso}`,
    '',
    '## Core Platform & Community Hubs',
    ...coreRoutes.map(
      (r) => `- [${r.title}](${DKP_CANONICAL_ORIGIN}${r.path || '/'}): Sezione pubblica ${r.category} di DevKernelPulse.`
    ),
    '',
    '## Technical Documentation & SDK (v2.6-PURE-SQL)',
    ...docsRoutes.map(
      (r) => `- [${r.title}](${DKP_CANONICAL_ORIGIN}${r.path}): Documentazione tecnica ufficiale e specifiche architetturali.`
    ),
    '',
    '## Developer Tools & AI Suite',
    ...toolsRoutes.map(
      (r) => `- [${r.title}](${DKP_CANONICAL_ORIGIN}${r.path}): Strumento interattivo per sviluppatori nell\'ecosistema DKP.`
    )
  ]

  if (posts.length > 0) {
    lines.push('', '## Latest Engineering Blog Articles')
    for (const post of posts.slice(0, 40)) {
      const proof = post.notarizationHash ? ` [Verified SHA-256: ${post.notarizationHash}]` : ''
      lines.push(`- [${post.title}](${post.url}): ${post.description} (Autore: ${post.author})${proof}`)
    }
  }

  if (nodes.length > 0) {
    lines.push('', '## Community Nodes & Thematic Forums')
    for (const node of nodes.slice(0, 30)) {
      lines.push(`- [${node.title}](${node.url}): ${node.description}`)
    }
  }

  if (threads.length > 0) {
    lines.push('', '## Recent Forum Discussions & Technical Threads')
    for (const thread of threads.slice(0, 40)) {
      const proof = thread.notarizationHash ? ` [Verified SHA-256: ${thread.notarizationHash}]` : ''
      lines.push(`- [${thread.title}](${thread.url}): ${thread.description} (Nodo: ${thread.category}, Autore: ${thread.author})${proof}`)
    }
  }

  lines.push(
    '',
    '## Citation & Attribution Policy',
    '- I contenuti pubblici su `/blog/`, `/nodes/`, `/item/`, `/docs/` e `/tools/` sono liberamente indicizzabili e citabili dai motori AI con attribuzione a **DevKernelPulse (https://devkernelpulse.org)**.',
    '- Gli hash `DKP-SHA256-VAULT` attestano la datazione e l\'integrità crittografica del contenuto originale.'
  )

  return lines.join('\n')
})