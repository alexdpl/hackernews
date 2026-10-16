// server/api/hn/feeds.get.ts
import { $fetch } from 'ofetch'

const BASE_URL = 'https://hacker-news.firebaseio.com/v0'

const feedsInfo = {
  ask: 'Ask Stories',
  jobs: 'Job Stories',
  show: 'Show Stories',
  newest: 'New Stories',
  news: 'Top Stories',
}

const validFeeds = Object.keys(feedsInfo)

const feedUrls: Record<keyof typeof feedsInfo, string> = {
  ask: 'askstories',
  jobs: 'jobstories',
  show: 'showstories',
  newest: 'newstories',
  news: 'topstories',
}

// Funzione interna autonoma per evitare errori di risoluzione moduli di Rollup
async function fetchHNItem(id: string) {
  try {
    const item: any = await $fetch(`${BASE_URL}/item/${id}.json`)
    if (!item) return null
    const kidsArray = item.kids ? Object.values(item.kids) : []
    return {
      id: item.id,
      user: item.by || 'anonymous',
      points: item.score || 0,
      time: item.time,
      content: item.text || '',
      url: item.url || '',
      type: item.type || 'story',
      title: item.title || 'Untitled',
      comments_count: kidsArray.length,
      comments: []
    }
  } catch {
    return null
  }
}

async function fetchFeed(feed: keyof typeof feedsInfo, page = '1') {
  const response = await $fetch<number[]>(`${BASE_URL}/${feedUrls[feed]}.json`)
  const entries = (response || []).slice((Number(page) - 1) * 10, Number(page) * 10).map(String)
  const results = await Promise.all(entries.map(id => fetchHNItem(id)))
  return results.filter(Boolean)
}

export default defineCachedEventHandler((event) => {
  const query = getQuery(event) as { page?: string, feed?: string }
  const page = query.page || '1'
  const feed = (query.feed || 'news') as keyof typeof feedsInfo

  if (!validFeeds.includes(feed) || String(Number(page)) !== page) {
    throw createError({
      statusCode: 422,
      statusMessage: `Must provide one of ${validFeeds.join(', ')} and a valid page number.`,
    })
  }

  return fetchFeed(feed, page)
}, {
  name: 'api/hn-feeds',
  getKey(event) {
    const query = getQuery(event)
    const page = query.page || '1'
    const feed = query.feed || 'news'
    return ['feeds', feed, page].join('/')
  },
  swr: false,
  maxAge: 60,
})