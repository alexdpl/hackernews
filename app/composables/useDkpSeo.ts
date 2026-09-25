// app/composables/useDkpSeo.ts
export function useDkpSeo(options: {
  title: string
  description?: string
  image?: string
  type?: 'website' | 'article'
}) {
  const route = useRoute()

  const siteName = 'DevKernelPulse'
  const fullTitle = `${options.title} | ${siteName}`
  const description = options.description || 'DevKernelPulse - La piattaforma ad alte prestazioni per developer, notizie tech e DKP Tools.'
  const image = options.image || 'https://devkernelpulse.duckdns.org/og-cover.png'
  const url = `https://devkernelpulse.duckdns.org${route.fullPath}`

  useHead({
    title: fullTitle,
    meta: [
      { name: 'description', content: description },
      
      // OpenGraph / Facebook / LinkedIn / Telegram / Discord
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: options.type || 'website' },

      // Twitter Cards / X
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ],
    link: [
      { rel: 'canonical', href: url }
    ]
  })
}