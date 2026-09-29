// server/utils/dkp-crawler/stealth.ts

export interface StealthOptions {
  deviceType?: 'desktop' | 'mobile' | 'all'
  referer?: string
}

// Pool aggiornato di User-Agent Desktop (Chrome, Firefox, Safari su Windows/macOS)
const DESKTOP_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
]

// Pool aggiornato di User-Agent Mobile (Android e iOS)
const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/605.1.15'
]

// Lista di Referer affidabili per simulare il traffico organico
const COMMON_REFERERS = [
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://news.ycombinator.com/',
  'https://t.co/',
  'https://www.reddit.com/'
]

/**
 * Restituisce uno User-Agent casuale in base alla tipologia di dispositivo
 */
export function getRandomUserAgent(deviceType: 'desktop' | 'mobile' | 'all' = 'desktop'): string {
  let pool = [...DESKTOP_USER_AGENTS]
  if (deviceType === 'mobile') pool = MOBILE_USER_AGENTS
  if (deviceType === 'all') pool = [...DESKTOP_USER_AGENTS, ...MOBILE_USER_AGENTS]

  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

/**
 * Pausa l'esecuzione introducendo un ritardo casuale (jitter) per simulare l'attesa umana
 */
export function delayWithJitter(minMs: number = 1200, maxMs: number = 3800): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Genera un set completo di intestazioni HTTP mimetiche anti-bot
 */
export function getStealthHeaders(options: StealthOptions = {}): Record<string, string> {
  const deviceType = options.deviceType || 'desktop'
  const userAgent = getRandomUserAgent(deviceType)
  const referer = options.referer || COMMON_REFERERS[Math.floor(Math.random() * COMMON_REFERERS.length)]
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')

  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': isMobile
      ? '"Chromium";v="125", "Not.A/Brand";v="24", "Google Chrome";v="125"'
      : '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': isMobile ? '"Android"' : '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Referer': referer
  }
}