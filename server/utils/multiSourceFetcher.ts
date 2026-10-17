import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 6000,
  headers: {
    'User-Agent': 'DevKernelPulse-Crawler/2.5-GOLD'
  }
})

// Mappatura definitiva con GitHub, GitLab, Hacker News, Reddit e portali di lavoro
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
    { name: 'GitHub Trending / Releases', url: 'https://github.com/trending.atom' }, // Feed Atom ufficiale dei trend GitHub
    { name: 'GitLab Releases', url: 'https://gitlab.com/explore/projects/trending.atom' }, // Feed Atom GitLab
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
  let allItems: any[] = []

  const promises = sources.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url)
      
      let items = feed.items || []
      // Filtro specifico per estrarre solo i post "Ask HN" dal feed generale di Hacker News
      if (section === 'ask' && source.name === 'Hacker News Ask') {
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
    } catch (err) {
      console.warn(`Impossibile recuperare il feed da ${source.name} (${source.url}):`, err)
      return []
    }
  })

  const results = await Promise.allSettled(promises)
  
  results.forEach((res) => {
    if (res.status === 'fulfilled') {
      allItems = allItems.concat(res.value)
    }
  })

  // Ordinamento cronologico decrescente
  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

  return allItems
}