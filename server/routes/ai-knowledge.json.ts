// server/routes/ai-knowledge.json.ts
import { defineEventHandler, setResponseHeaders } from 'h3'
import {
  DKP_CANONICAL_ORIGIN,
  fetchIndexableDkpContent
} from '~~/server/utils/dkpSeoEngine'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Type': 'application/ld+json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'Access-Control-Allow-Origin': '*'
  })

  const { posts, nodes, threads } = await fetchIndexableDkpContent()
  const nowIso = new Date().toISOString()

  const graph: Record<string, any>[] = [
    {
      '@type': 'Organization',
      '@id': `${DKP_CANONICAL_ORIGIN}/#organization`,
      name: 'DevKernelPulse',
      alternateName: 'DKP',
      url: DKP_CANONICAL_ORIGIN,
      logo: {
        '@type': 'ImageObject',
        url: `${DKP_CANONICAL_ORIGIN}/dkp-logo.svg`
      },
      founder: {
        '@type': 'Person',
        name: 'Alessandro De Paola',
        url: `${DKP_CANONICAL_ORIGIN}/user/alexdpl`
      },
      knowsAbout: [
        'Software Architecture',
        'Nuxt 4',
        'PostgreSQL Pure SQL',
        'Artificial Intelligence Engineering',
        'Static Application Security Testing (SAST)',
        'Cryptographic Notarization SHA-256'
      ]
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${DKP_CANONICAL_ORIGIN}/#platform`,
      name: 'DevKernelPulse Kernel',
      softwareVersion: 'v2.6-PURE-SQL',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web, Cloud',
      url: DKP_CANONICAL_ORIGIN,
      publisher: { '@id': `${DKP_CANONICAL_ORIGIN}/#organization` },
      documentation: `${DKP_CANONICAL_ORIGIN}/docs/api`
    },
    ...posts.slice(0, 50).map((post) => ({
      '@type': 'TechArticle',
      '@id': post.url,
      url: post.url,
      headline: post.title,
      description: post.description,
      articleSection: post.category,
      dateModified: post.updatedAt,
      inLanguage: 'it-IT',
      author: {
        '@type': 'Person',
        name: post.author
      },
      publisher: { '@id': `${DKP_CANONICAL_ORIGIN}/#organization` },
      ...(post.notarizationHash
        ? {
            identifier: {
              '@type': 'PropertyValue',
              propertyID: 'DKP-SHA256-VAULT',
              value: post.notarizationHash
            },
            creativeWorkStatus: 'Verified On-Chain'
          }
        : {})
    })),
    ...nodes.slice(0, 30).map((node) => ({
      '@type': 'CollectionPage',
      '@id': node.url,
      url: node.url,
      name: node.title,
      description: node.description,
      isPartOf: { '@id': `${DKP_CANONICAL_ORIGIN}/#platform` }
    })),
    ...threads.slice(0, 50).map((thread) => ({
      '@type': 'DiscussionForumPosting',
      '@id': thread.url,
      url: thread.url,
      headline: thread.title,
      text: thread.description,
      about: thread.category,
      dateModified: thread.updatedAt,
      inLanguage: 'it-IT',
      author: {
        '@type': 'Person',
        name: thread.author
      },
      publisher: { '@id': `${DKP_CANONICAL_ORIGIN}/#organization` },
      ...(thread.notarizationHash
        ? {
            identifier: {
              '@type': 'PropertyValue',
              propertyID: 'DKP-SHA256-VAULT',
              value: thread.notarizationHash
            }
          }
        : {})
    }))
  ]

  return {
    '@context': 'https://schema.org',
    dateModified: nowIso,
    '@graph': graph
  }
})