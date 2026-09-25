// server/routes/rss.xml.ts
export default defineEventHandler(async (event) => {
  const feedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevKernelPulse - Tech Feed</title>
    <link>https://devkernelpulse.duckdns.org</link>
    <description>Notizie tech, architetture software e aggiornamenti dall'ecosistema DevKernelPulse.</description>
    <language>it-IT</language>
    <atom:link href="https://devkernelpulse.duckdns.org/rss.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>DevKernelPulse v2.0 Released: Modular SaaS Architecture with Nuxt 3 &amp; GCP</title>
      <link>https://devkernelpulse.duckdns.org/news/1</link>
      <guid>https://devkernelpulse.duckdns.org/news/1</guid>
      <description>Rilasciata la versione 2.0 di DevKernelPulse con DKP Auth Core, DKP Vault, Neon PostgreSQL e SSR superveloce su GCP.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`

  setHeader(event, 'Content-Type', 'text/xml; charset=utf-8')
  return feedXml
})