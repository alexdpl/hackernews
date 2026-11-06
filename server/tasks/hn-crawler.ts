// server/tasks/hn-crawler.ts
export default defineTask({
  meta: {
    name: 'hn:crawl',
    description: 'Fetch e arricchimento automatico notizie Hacker News'
  },
  async run() {
    // 1. Fetch top IDs -> 2. Filtra esistenti -> 3. Passa a Trinity AI -> 4. Salva su DB
    return { result: 'success' }
  }
})