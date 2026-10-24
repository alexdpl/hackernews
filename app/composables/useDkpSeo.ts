// app/composables/useDkpSeo.ts
export function useDkpSeo(options: {
  title: string
  description?: string
  image?: string
  type?: 'website' | 'article'
}) {
  const route = useRoute()

  const siteName = 'DevKernelPulse (DKP)'
  const fullTitle = `${options.title} | ${siteName}`
  const description = options.description || 'DevKernelPulse v2.5-GOLD - Ecosistema SaaS avanzato per Nuxt 4, API Gateway crittografato, Neural Playground (OpenRouter AI) e Proof-of-Code Vault.'
  const image = options.image || 'https://devkernelpulse.org/og-cover.png'
  const url = `https://devkernelpulse.org${route.fullPath}`

  useHead({
    title: fullTitle,
    meta: [
      { name: 'description', content: description },
      { name: 'keywords', content: 'DevKernelPulse, DKP, Nuxt 4, OpenUI Studio, OpenRouter, Neon DB, Drizzle ORM, AI Gateway, Proof of Code, API Management' },
      { name: 'author', content: 'Alexdpl - DevKernelPulse Core Architecture' },
      
      // Controllo Crawler & AI Indexing (Google, Bing, ChatGPT Search, Perplexity)
      { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      
      // OpenGraph / Facebook / LinkedIn / Telegram / Discord / ChatGPT Citation Previews
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: options.type || 'website' },
      { property: 'og:locale', content: 'it_IT' },

      // Twitter Cards / X
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@devkernelpulse' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ],
    link: [
      { rel: 'canonical', href: url }
    ]
  })
}