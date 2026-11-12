// app/composables/useDkpSeo.ts
import { unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export interface DkpSeoOptions {
  title: MaybeRef<string>
  description?: MaybeRef<string>
  image?: MaybeRef<string>
  keywords?: MaybeRef<string>
  type?: 'website' | 'article'
  noindex?: MaybeRef<boolean>
  publishedTime?: MaybeRef<string>
  modifiedTime?: MaybeRef<string>
}

export function useDkpSeo(options: DkpSeoOptions) {
  const route = useRoute()

  const siteName = 'DevKernelPulse'
  const baseUrl = 'https://devkernelpulse.org'

  useHead(() => {
    const title = unref(options.title)

    const description =
      unref(options.description) ||
      'DevKernelPulse v2.6-PURE-SQL — Ecosistema SaaS su Nuxt 4, Neon PostgreSQL Pure SQL, API Gateway crittografato, OpenUI Studio AI e Proof of Code Vault.'

    const rawImage = unref(options.image) || `${baseUrl}/dkp-logo.svg`
    const image = rawImage.startsWith('http')
      ? rawImage
      : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`

    const keywords =
      unref(options.keywords) ||
      'DevKernelPulse, DKP, Nuxt 4, Neon PostgreSQL, Pure SQL, OpenRouter, Trinity AI, OpenUI Studio, API Gateway, Proof of Code'

    // Canonical pulito basato su route.path (evita duplicazioni da query string)
    const cleanPath = route.path === '/' ? '/' : route.path.replace(/\/+$/, '')
    const canonicalUrl = `${baseUrl}${cleanPath}`

    const isNoindex = Boolean(unref(options.noindex))
    const ogType = options.type || 'website'
    const publishedTime = unref(options.publishedTime)
    const modifiedTime = unref(options.modifiedTime)

    const meta: Record<string, string>[] = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'Alessandro De Paola (@alexdpl)' },
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

    const jsonLd =
      ogType === 'article'
        ? {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: title,
            description,
            image,
            url: canonicalUrl,
            ...(publishedTime ? { datePublished: publishedTime } : {}),
            ...(modifiedTime ? { dateModified: modifiedTime } : {}),
            author: {
              '@type': 'Person',
              name: 'Alessandro De Paola'
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
              logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/dkp-logo.svg`
              }
            }
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteName,
            description,
            url: canonicalUrl
          }

    return {
      title,
      meta,
      link: [
        {
          rel: 'canonical',
          href: canonicalUrl
        }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd)
        }
      ]
    }
  })
}