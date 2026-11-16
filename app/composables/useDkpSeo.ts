// app/composables/useDkpSeo.ts
import { unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export interface DkpSeoOptions {
  title: MaybeRef<string>
  description?: MaybeRef<string>
  image?: MaybeRef<string>
  keywords?: MaybeRef<string>
  type?: 'website' | 'article' | 'forum' | 'collection'
  noindex?: MaybeRef<boolean>
  publishedTime?: MaybeRef<string>
  modifiedTime?: MaybeRef<string>
  authorName?: MaybeRef<string>
  authorUrl?: MaybeRef<string>
  section?: MaybeRef<string>
  commentCount?: MaybeRef<number>
  notarizationHash?: MaybeRef<string>
  canonicalPath?: MaybeRef<string>
}

export function useDkpSeo(options: DkpSeoOptions) {
  const route = useRoute()

  const siteName = 'DevKernelPulse'
  const baseUrl = 'https://devkernelpulse.org'

  useHead(() => {
    const title = unref(options.title)

    const description =
      unref(options.description) ||
      'DevKernelPulse v2.6-PURE-SQL — Community tecnica, blog ingegneristico, nodi forum, API Gateway crittografato e Proof of Code Vault on-chain.'

    const rawImage = unref(options.image) || `${baseUrl}/dkp-logo.svg`
    const image = rawImage.startsWith('http')
      ? rawImage
      : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`

    const keywords =
      unref(options.keywords) ||
      'DevKernelPulse, DKP, Nuxt 4, Neon PostgreSQL, Pure SQL, Forum Sviluppatori, OpenRouter, Trinity AI, Proof of Code, SHA-256'

    const explicitPath = unref(options.canonicalPath)
    const rawPath = explicitPath || route.path
    const cleanPath = rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '')
    const canonicalUrl = `${baseUrl}${cleanPath}`

    const isNoindex = Boolean(unref(options.noindex))
    const seoType = options.type || 'website'
    const ogType = seoType === 'article' || seoType === 'forum' ? 'article' : 'website'

    const publishedTime = unref(options.publishedTime)
    const modifiedTime = unref(options.modifiedTime)
    const authorName = unref(options.authorName) || 'Alessandro De Paola'
    const authorUrl = unref(options.authorUrl) || `${baseUrl}/user/alexdpl`
    const section = unref(options.section)
    const commentCount = unref(options.commentCount)
    const notarizationHash = unref(options.notarizationHash)

    const meta: Record<string, string>[] = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: authorName },
      { name: 'generator', content: 'DevKernelPulse v2.6-PURE-SQL' },
      { name: 'theme-color', content: '#020420' },
      {
        name: 'robots',
        content: isNoindex
          ? 'noindex,nofollow'
          : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
      },

      // Open Graph
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: title },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:type', content: ogType },
      { property: 'og:locale', content: 'it_IT' },

      // Twitter / X Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ]

    if (ogType === 'article' && publishedTime) {
      meta.push({ property: 'article:published_time', content: publishedTime })
    }
    if (ogType === 'article' && modifiedTime) {
      meta.push({ property: 'article:modified_time', content: modifiedTime })
    }
    if (ogType === 'article' && section) {
      meta.push({ property: 'article:section', content: section })
    }
    if (notarizationHash) {
      meta.push({ name: 'dkp:notarization-sha256', content: notarizationHash })
    }

    // Costruzione BreadcrumbList automatico dai segmenti URL
    const segments = cleanPath.split('/').filter(Boolean)
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      ...segments.map((seg, idx) => ({
        '@type': 'ListItem',
        position: idx + 2,
        name: decodeURIComponent(seg).replace(/[-_]+/g, ' '),
        item: `${baseUrl}/${segments.slice(0, idx + 1).join('/')}`
      }))
    ]

    const publisherNode = {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/dkp-logo.svg`
      }
    }

    const authorNode = {
      '@type': 'Person',
      name: authorName,
      url: authorUrl
    }

    const notarizationProps = notarizationHash
      ? {
          identifier: {
            '@type': 'PropertyValue',
            propertyID: 'DKP-SHA256-VAULT',
            value: notarizationHash
          },
          creativeWorkStatus: 'Verified On-Chain'
        }
      : {}

    let mainEntityJsonLd: Record<string, any>

    if (seoType === 'article') {
      mainEntityJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        headline: title,
        description,
        image,
        url: canonicalUrl,
        inLanguage: 'it-IT',
        ...(section ? { articleSection: section } : {}),
        ...(publishedTime ? { datePublished: publishedTime } : {}),
        ...(modifiedTime ? { dateModified: modifiedTime } : {}),
        ...(typeof commentCount === 'number' ? { commentCount } : {}),
        ...notarizationProps,
        author: authorNode,
        publisher: publisherNode
      }
    } else if (seoType === 'forum') {
      mainEntityJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        headline: title,
        text: description,
        url: canonicalUrl,
        inLanguage: 'it-IT',
        ...(section ? { about: section } : {}),
        ...(publishedTime ? { datePublished: publishedTime } : {}),
        ...(modifiedTime ? { dateModified: modifiedTime } : {}),
        ...(typeof commentCount === 'number'
          ? {
              interactionStatistic: {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/CommentAction',
                userInteractionCount: commentCount
              }
            }
          : {}),
        ...notarizationProps,
        author: authorNode,
        publisher: publisherNode
      }
    } else if (seoType === 'collection') {
      mainEntityJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: 'it-IT',
        isPartOf: {
          '@type': 'WebSite',
          name: siteName,
          url: baseUrl
        }
      }
    } else {
      mainEntityJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        description,
        url: baseUrl,
        inLanguage: 'it-IT',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/news?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems
    }

    return {
      title,
      htmlAttrs: {
        lang: 'it'
      },
      meta,
      link: [
        {
          rel: 'canonical',
          href: canonicalUrl
        },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'DevKernelPulse RSS Feed',
          href: `${baseUrl}/rss.xml`
        }
      ],
      script: [
        {
          key: 'dkp-ld-main',
          type: 'application/ld+json',
          innerHTML: JSON.stringify(mainEntityJsonLd)
        },
        {
          key: 'dkp-ld-breadcrumb',
          type: 'application/ld+json',
          innerHTML: JSON.stringify(breadcrumbJsonLd)
        }
      ]
    }
  })
}