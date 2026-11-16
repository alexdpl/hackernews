// server/routes/rss.xml.ts
import { defineEventHandler, setResponseHeaders } from 'h3'
import {
  DKP_CANONICAL_ORIGIN,
  escapeXml,
  fetchIndexableDkpContent
} from '~~/server/utils/dkpSeoEngine'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=600'
  })

  const currentDate = new Date().toUTCString()
  const { posts, threads } = await fetchIndexableDkpContent()

  // Combina gli ultimi articoli del blog e le discussioni principali in ordine cronologico
  const feedItems = [...posts, ...threads]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 50)

  let itemsXml = feedItems
    .map((item) => {
      const pubDate = new Date(item.updatedAt).toUTCString()
      const badgePrefix = item.kind === 'blog' ? '[BLOG]' : '[FORUM]'
      const hashNote = item.notarizationHash ? ` • Verified SHA-256: ${item.notarizationHash}` : ''

      return `    <item>
      <title><![CDATA[${badgePrefix} ${item.title}]]></title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <category><![CDATA[${item.category}]]></category>
      <description><![CDATA[${item.description}${hashNote}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`
    })
    .join('\n')

  if (!itemsXml) {
    itemsXml = `    <item>
      <title><![CDATA[DevKernelPulse v2.6-PURE-SQL: Architecture, AI Gateway & Proof of Code Vault]]></title>
      <link>${DKP_CANONICAL_ORIGIN}/roadmap</link>
      <guid isPermaLink="true">${DKP_CANONICAL_ORIGIN}/roadmap</guid>
      <description><![CDATA[Ecosistema SaaS e community tecnica su Nuxt 4, Neon PostgreSQL Pure SQL, AI Trinity e notarizzazione SHA-256 on-chain.]]></description>
      <pubDate>${currentDate}</pubDate>
    </item>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevKernelPulse v2.6-PURE-SQL — Engineering Blog &amp; Forum Feed</title>
    <link>${DKP_CANONICAL_ORIGIN}</link>
    <description>Articoli tecnici, discussioni del forum, architetture Nuxt 4 + Neon Pure SQL, AI Security e Proof of Code Vault.</description>
    <language>it-IT</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${DKP_CANONICAL_ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`
})