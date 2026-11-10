// server/api/cron/fetch-news.ts
import { sql } from '~~/server/utils/db'

interface HNItem {
  id: number
  title: string
  url?: string
  by: string
  score: number
  time: number
  type: string
}

async function purgeCloudflareCache(urls: string[]) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken) return false

  try {
    const res = await $fetch<{ success: boolean }>(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: { files: urls }
      }
    )
    return res.success
  } catch (err) {
    console.error('[Cloudflare Purge Error]:', err)
    return false
  }
}

export default defineEventHandler(async () => {
  try {
    const topStoryIds = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
    const targetIds = topStoryIds.slice(0, 30)

    const storiesData = await Promise.all(
      targetIds.map(id =>
        $fetch<HNItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
      )
    )

    let importedCount = 0

    for (const story of storiesData) {
      if (!story || !story.title || story.type !== 'story') continue

      let domain = 'news.ycombinator.com'
      if (story.url) {
        try {
          domain = new URL(story.url).hostname.replace(/^www\./, '')
        } catch {
          domain = 'news.ycombinator.com'
        }
      }

      const slug = `hn-${story.id}`
      const storyUrl = story.url || `https://news.ycombinator.com/item?id=${story.id}`
      const createdAtIso = new Date(story.time * 1000).toISOString()
      const points = story.score || 0

      // Pure SQL nativo ad altissima velocità
      await sql`
        INSERT INTO pulse_stories (title, url, slug, domain, points, type, created_at)
        VALUES (${story.title}, ${storyUrl}, ${slug}, ${domain}, ${points}, 'story', ${createdAtIso}::timestamptz)
        ON CONFLICT (slug)
        DO UPDATE SET points = EXCLUDED.points
      `

      importedCount++
    }

    let cachePurged = false
    if (importedCount > 0) {
      const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://devkernelpulse.org'
      cachePurged = await purgeCloudflareCache([`${baseUrl}/api/news`])
    }

    return {
      success: true,
      processed: targetIds.length,
      imported: importedCount,
      cachePurged,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Errore ingestione notizie: ${error.message}`
    })
  }
})