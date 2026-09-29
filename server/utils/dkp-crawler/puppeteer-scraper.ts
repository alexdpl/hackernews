// server/utils/dkp-crawler/puppeteer-scraper.ts
import puppeteer, { Browser, Page } from 'puppeteer'
import { load } from 'cheerio'
import type { ScrapedArticleData } from './cheerio-scraper'
import { getRandomUserAgent, getStealthHeaders } from './stealth'

export interface PuppeteerScraperOptions {
  timeoutMs?: number
  deviceType?: 'desktop' | 'mobile'
  waitForSelector?: string
  blockAssets?: boolean
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[\n\r\t]/g, ' ').trim()
}

export async function scrapeDynamicPage(
  targetUrl: string,
  options: PuppeteerScraperOptions = {}
): Promise<ScrapedArticleData> {
  const timeoutMs = options.timeoutMs || 20000
  const blockAssets = options.blockAssets !== false

  let browser: Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1280,800'
      ]
    })

    const page: Page = await browser.newPage()

    const userAgent = getRandomUserAgent(options.deviceType || 'desktop')
    await page.setUserAgent(userAgent)
    await page.setExtraHTTPHeaders(getStealthHeaders({ deviceType: options.deviceType || 'desktop' }))
    await page.setViewport({ width: 1280, height: 800 })

    if (blockAssets) {
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })
    }

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: timeoutMs
    })

    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 5000 }).catch(() => {
        console.warn(`[Puppeteer] Timeout attesa selettore: ${options.waitForSelector}`)
      })
    }

    const html = await page.content()
    await page.close()
    await browser.close()
    browser = null

    const $= load(html)
	$('script, style, noscript, iframe, nav, footer, header, svg, form, [role="navigation"]').remove()

    const ogTitle = $('meta[property="og:title"]').attr('content') || ''
    const docTitle = $('title').text() || ''
    const h1Title = $('h1').first().text() || ''
    const title = cleanText(ogTitle) || cleanText(docTitle) || cleanText(h1Title) || 'Senza Titolo'

    const ogDesc = $('meta[property="og:description"]').attr('content') || ''
    const metaDesc = $('meta[name="description"]').attr('content') || ''
    const description = cleanText(ogDesc) || cleanText(metaDesc) || undefined

    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || undefined
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || targetUrl
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(targetUrl).hostname.replace('www.', '')

    let contentSelector = 'article'
    if ($(contentSelector).length === 0) {
      contentSelector = 'main'
    }
    if ($(contentSelector).length === 0) {
      contentSelector = 'body'
    }

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
      siteName,
      contentText: fullContent,
      summary,
      wordCount,
      extractedAt: new Date().toISOString()
    }
  } catch (error) {
    if (browser) {
      await browser.close()
    }
    throw new Error(`[Puppeteer Scraper Error] ${error instanceof Error ? error.message : String(error)}`)
  }
}