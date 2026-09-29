// scripts/test-crawler.ts
import { DKPCrawlerEngine } from '../server/utils/dkp-crawler/engine'

async function testEngine() {
  console.log('🚀 Avvio Test del DKP Deep Scraping Engine...\n')

  // 1. Test URL Statica (Cheerio)
  const staticUrl = 'https://news.ycombinator.com/'
  console.log(`1️⃣ Test URL Statica: ${staticUrl}`)
  const res1 = await DKPCrawlerEngine.deepCrawl(staticUrl, { enableJitter: false })
  console.log(` Status: ${res1.success ? '✅ OK' : '❌ ERRORE'}`)
  console.log(` Motore Usato: ${res1.engineUsed}`)
  console.log(` Tempo Esecuzione: ${res1.executionTimeMs} ms`)
  console.log(` Titolo: ${res1.data?.title}`)
  console.log(` Parole Estratte: ${res1.data?.wordCount}\n`)

  // 2. Test URL Dinamica SPA (Puppeteer)
  const dynamicUrl = 'https://react.dev/'
  console.log(`2️⃣ Test URL Dinamica SPA: ${dynamicUrl}`)
  const res2 = await DKPCrawlerEngine.deepCrawl(dynamicUrl, { minWordCountThreshold: 200 })
  console.log(` Status: ${res2.success ? '✅ OK' : '❌ ERRORE'}`)
  console.log(` Motore Usato: ${res2.engineUsed}`)
  console.log(` Tempo Esecuzione: ${res2.executionTimeMs} ms`)
  console.log(` Titolo: ${res2.data?.title}`)
  console.log(` Parole Estratte: ${res2.data?.wordCount}\n`)
}

testEngine()