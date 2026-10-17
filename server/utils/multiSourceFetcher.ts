// server/utils/multiSourceFetcher.ts
import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
  }
})

// Mappatura completa e originale con tutte le fonti
const FEED_SOURCES: Record<string, { name: string; url: string }[]> = {
  news: [
    { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
    { name: 'Dev.to', url: 'https://dev.to/feed' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' }
  ],
  ask: [
    { name: 'Hacker News Ask', url: 'https://news.ycombinator.com/rss' },
    { name: 'Reddit Programming', url: 'https://www.reddit.com/r/programming/.rss' },
    { name: 'Reddit CS Career', url: 'https://www.reddit.com/r/cscareerquestions/.rss' }
  ],
  show: [
    { name: 'GitHub Trending / Releases', url: 'https://github.com/trending.atom' },
    { name: 'GitLab Releases', url: 'https://gitlab.com/explore/projects/trending.atom' },
    { name: 'Product Hunt', url: 'https://www.producthunt.com/feed' },
    { name: 'Lobsters Show', url: 'https://lobste.rs/t/show.rss' }
  ],
  jobs: [
    { name: 'We Work Remotely', url: 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss' },
    { name: 'Remote OK', url: 'https://remoteok.com/remote-dev-jobs.rss' }
  ]
}

export async function fetchMultiSourceFeed(section: string = 'news') {
  const sources = FEED_SOURCES[section] || FEED_SOURCES.news
  let balancedItems: any[] = []

  // Interroga tutte le fonti in parallelo
  const promises = sources.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url)
      let items = feed.items || []

      if (section === 'ask' && source.name.toLowerCase().includes('hacker news')) {
        items = items.filter(item => item.title && item.title.toLowerCase().includes('ask hn'))
      }

      return items.map((item) => ({
        id: item.guid || item.link || Math.random().toString(36).substring(7),
        title: item.title || 'Senza titolo',
        link: item.link || '#',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        author: item.creator || item.author || source.name,
        sourceName: source.name,
        snippet: item.contentSnippet || item.summary || ''
      }))
    } catch (err: any) {
      console.warn(`[RSS Warning] Impossibile raggiungere ${source.name}:`, err?.message || err)
      return []
    }
  })

  const results = await Promise.all(promises)

  // ⚖️ ROUND-ROBIN EQUO: Prende a rotazione un elemento da ciascuna fonte
  // In questo modo nessuna fonte sovrasta le altre e vengono mischiate perfettamente.
  let maxItemsLength = Math.max(...results.map(r => r.length), 0)

  for (let i = 0; i < maxItemsLength; i++) {
    for (const sourceItems of results) {
      if (sourceItems[i]) {
        balancedItems.push(sourceItems[i])
      }
    }
  }

  return balancedItems
}