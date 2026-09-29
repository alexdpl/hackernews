// server/utils/dkp-crawler/cheerio-scraper.ts
import { load } from 'cheerio'
import { getStealthHeaders } from './stealth'

export interface ScrapedArticleData {
  url: string
  canonicalUrl?: string
  title: string
  description?: string
  ogImage?: string
  author?: string
  publishedAt?: string
  siteName?: string
  contentText: string
  summary: string
  wordCount: number
  extractedAt: string
}

export interface CheerioScraperOptions {
  timeoutMs?: number
  customHeaders?: Record<string, string>
  deviceType?: 'desktop' | 'mobile'
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim()
}

export async function scrapeStaticPage(
  targetUrl: string,
  options: CheerioScraperOptions = {}
): Promise<ScrapedArticleData> {
  const timeoutMs = options.timeoutMs || 10000
  const headers = {
    ...getStealthHeaders({ deviceType: options.deviceType || 'desktop' }),
    ...(options.customHeaders || {})
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let html = ''
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`)
    }

    html = await response.text()
  } finally {
    clearTimeout(timeoutId)
  }

  const $ = load(html)

  $('script, style, noscript, iframe, nav, footer, header, svg, form, [role="navigation"]').remove()

  const title =
    cleanText($('meta[property="og:title"]').attr('content') || '') ||
    cleanText($('meta[name="twitter:title"]').attr('content') || '') ||
    cleanText($('title').text()) ||
    cleanText($('h1').first().text()) ||
    'Senza Titolo'

  const description =
    cleanText($('meta[property="og:description"]').attr('content') || '') ||
    cleanText($('meta[name="twitter:description"]').attr('content') || '') ||
    cleanText($('meta[name="description"]').attr('content') || '') ||
    undefined

  const ogImage =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[property="og:image:secure_url"]').attr('content') ||
    undefined

  const canonicalUrl = $('link[rel="canonical"]').attr('href') || targetUrl
  const siteName =
    $('meta[property="og:site_name"]').attr('content') ||
    new URL(targetUrl).hostname.replace('www.', '')

  const author =
    $('meta[property="article:author"]').attr('content') ||
    $('meta[name="author"]').attr('content') ||
    $('[rel="author"]').first().text() ||
    undefined

 const publishedAt = [
  $('meta[property="article:published_time"]').attr('content'),
  $('time[datetime]').attr('datetime'),
  $('meta[name="publication_date"]').attr('content')
].find((val) => Boolean(val)) || undefined

  let contentSelector = 'article'
  if ($(contentSelector).length === 0) contentSelector = 'main'
  if ($(contentSelector).length === 0) contentSelector = 'body'

  const paragraphTexts: string[] = []
  $(contentSelector)
    .find('p, h2, h3, h4, li')
    .each((_, el) => {
      const txt = cleanText($(el).text())
      if (txt.length > 25) {
        paragraphTexts.push(txt)
      }
    })

  const fullContent = paragraphTexts.join('\n\n')
  const summary = description || paragraphTexts.slice(0, 2).join(' ').substring(0, 300) + '...'
  const wordCount = fullContent.split(/\s+/).filter(Boolean).length

  return {
    url: targetUrl,
    canonicalUrl,
    title,
    description,
    ogImage,
    author: author ? cleanText(author) : undefined,
    publishedAt,
    siteName,
    contentText: fullContent,
    summary,
    wordCount,
    extractedAt: new Date().toISOString()
  }
}