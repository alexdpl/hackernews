// tests/playwright/app.spec.ts
import { test, expect } from '@playwright/test'

test.describe('DKP v2.6 Pure-SQL — Server API & AI/SEO Endpoints', () => {
  test('restituisce campagne attive da /api/ads/active anche senza DB', async ({ request }) => {
    const res = await request.get('/api/ads/active?placement=global&limit=3')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.circuit).toBe('DKP-ADS-v2.6-PURE-SQL')
    expect(Array.isArray(body.ads)).toBe(true)
    expect(body.ads.length).toBeGreaterThan(0)
    expect(body.ads[0]).toHaveProperty('title')
    expect(body.ads[0]).toHaveProperty('url')
  })

  test('valida i parametri di /api/ads/track (400 su payload vuoto, 200 su tracking valido)', async ({ request }) => {
    const invalidRes = await request.post('/api/ads/track', {
      data: {},
    })
    expect(invalidRes.status()).toBe(400)

    const validRes = await request.post('/api/ads/track', {
      data: {
        campaignId: 'dkp-house-01',
        actionType: 'impression',
      },
    })
    expect(validRes.status()).toBe(200)
    const tracked = await validRes.json()
    expect(tracked).toMatchObject({
      success: true,
      tracked: 'impression',
      campaignId: 'dkp-house-01',
    })
  })

  test('espone correttamente robots.txt, sitemap.xml e rss.xml', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap:')

    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const sitemapText = await sitemap.text()
    expect(sitemapText).toContain('<urlset')
    expect(sitemapText).toContain('https://devkernelpulse.org')

    const rss = await request.get('/rss.xml')
    expect(rss.status()).toBe(200)
    expect(await rss.text()).toContain('<rss')
  })

  test('espone i manifesti AI Visibility (llms.txt e ai-knowledge.json)', async ({ request }) => {
    const llms = await request.get('/llms.txt')
    expect(llms.status()).toBe(200)
    expect(await llms.text()).toContain('DevKernelPulse')

    const aiJson = await request.get('/ai-knowledge.json')
    expect(aiJson.status()).toBe(200)
    const data = await aiJson.json()
    expect(data).toBeTruthy()
  })
})

test.describe('DKP v2.6 Pure-SQL — Pages SSR & Navigazione', () => {
  test('renderizza la homepage senza errori server', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('renderizza le rotte principali (/blog, /nodes, /shop, /docs/api, /tools/proof-of-code) senza 500', async ({ page }) => {
    const routes = ['/blog', '/nodes', '/shop', '/docs/api', '/tools/proof-of-code']
    for (const route of routes) {
      const res = await page.goto(route)
      expect(res?.status() ?? 500, `Rotta ${route} ha restituito errore server`).toBeLessThan(500)
    }
  })

  test('gestisce rotte inesistenti senza crash 500', async ({ request }) => {
    const res = await request.get('/rotta-inesistente-dkp-test')
    expect(res.status()).toBeLessThan(500)
  })
})