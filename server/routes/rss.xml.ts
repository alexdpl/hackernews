// server/routes/rss.xml.ts
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/xml; charset=utf-8')

  const baseUrl = 'https://devkernelpulse.org'
  const currentDate = new Date().toUTCString()

  // Tentiamo di prelevare gli articoli dal blog/news dinamicamente
  let itemsXml = ''
  try {
    const blogRes: any = await $fetch('/api/blog/posts').catch(() => null)
    const posts = blogRes?.posts || blogRes || []
    
    if (Array.isArray(posts) && posts.length > 0) {
      itemsXml = posts.map((post: any) => {
        const title = post.title || 'Aggiornamento DevKernelPulse'
        const slug = post.slug || post.id || 'news'
        const link = `${baseUrl}/blog/${slug}`
        const description = post.description || post.excerpt || 'Nuovo articolo tecnico dall\'ecosistema DKP v2.5-GOLD.'
        const pubDate = post.createdAt ? new Date(post.createdAt).toUTCString() : currentDate
        
        return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`
      }).join('')
    }
  } catch (e) {
    // Fallback con elemento di default se il fetch fallisce
  }

  // Se non ci sono post dinamici, inseriamo la release di punta v2.5-GOLD
  if (!itemsXml) {
    itemsXml = `
    <item>
      <title><![CDATA[DevKernelPulse v2.5-GOLD Released: Neural Gateway & OpenUI Studio]]></title>
      <link>${baseUrl}/roadmap</link>
      <guid>${baseUrl}/roadmap</guid>
      <description><![CDATA[Rilasciata la versione v2.5-GOLD di DevKernelPulse con OpenRouter AI Gateway, DKP Trinity Models, API Metering e Paywall Dinamico su Neon DB.]]></description>
      <pubDate>${currentDate}</pubDate>
    </item>`
  }

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevKernelPulse - Tech Feed &amp; AI Ecosystem</title>
    <link>${baseUrl}</link>
    <description>Notizie tech, architetture software avanzate, aggiornamenti sull'ecosistema DevKernelPulse v2.5-GOLD e guide sullo sviluppo con Nuxt 4 e IA.</description>
    <language>it-IT</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`
})