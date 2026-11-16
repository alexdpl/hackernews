<!-- app/components/DkpAdStrip.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    categoryTag?: string
    topic?: string
    tags?: string[]
  }>(),
  {
    categoryTag: 'DKP DEV LIBRARY • LIBRI & RISORSE',
    topic: '',
    tags: () => []
  }
)

interface AffiliateItem {
  id: string | number
  title: string
  snippet: string
  url: string
  tag: string
  provider: string
  isAmazon: boolean
}

const formatProvider = (rawProvider?: string, url = '') => {
  if (/amazon\.|amzn\./i.test(url)) return 'Amazon Partner'
  if (!rawProvider || rawProvider.includes('@')) return 'DKP Affiliate Pick'
  return rawProvider
}

function normalizeSafeUrl(rawUrl?: string): string {
  const clean = String(rawUrl || '').trim()
  if (!clean || clean === '#' || /^(javascript|data|vbscript):/i.test(clean)) {
    return '/shop'
  }
  if (clean === '/vault') return '/nodes/n/blockchain-vault'
  if (clean === '/api-console') return '/user/dashboard?tab=api'
  return clean
}

// Fallback curati (usati solo se /api/ads/active restituisce meno di 3 libri)
const fallbackBooks: AffiliateItem[] = [
  {
    id: 'fallback-book-1',
    title: 'Designing Data-Intensive Applications',
    snippet: 'La bibbia dell ingegneria dei sistemi distribuiti, database scalabili, replicazione e architetture Pure-SQL.',
    url: '/shop',
    tag: 'SYSTEM DESIGN',
    provider: 'DKP Library',
    isAmazon: false
  },
  {
    id: 'fallback-book-2',
    title: 'Clean Architecture & Domain-Driven Design',
    snippet: 'Pattern architetturali per mantenere il codice modulare, disaccoppiato e pronto per la produzione enterprise.',
    url: '/shop',
    tag: 'ARCHITECTURE',
    provider: 'DKP Library',
    isAmazon: false
  },
  {
    id: 'fallback-book-3',
    title: 'AI Engineering & LLM Production Systems',
    snippet: 'Guida pratica a Structured Outputs, RAG, sicurezza SAST e pipeline di inferenza affidabili in produzione.',
    url: '/shop',
    tag: 'AI & LLM',
    provider: 'DKP Library',
    isAmazon: false
  }
]

const rawDbAds = ref<AffiliateItem[]>([])
const stripRef = ref<HTMLElement | null>(null)
const impressionsTracked = ref(false)
let observer: IntersectionObserver | null = null

// Ordina i libri Amazon dando priorità a quelli coerenti col topic/tag della pagina corrente
const ads = computed<AffiliateItem[]>(() => {
  const source = rawDbAds.value.length > 0 ? [...rawDbAds.value] : []

  const keywords = [
    props.topic,
    ...(props.tags || [])
  ]
    .map((k) => String(k || '').toLowerCase().trim())
    .filter((k) => k.length >= 2)

  if (keywords.length > 0 && source.length > 1) {
    source.sort((a, b) => {
      const textA = `${a.title} ${a.snippet} ${a.tag}`.toLowerCase()
      const textB = `${b.title} ${b.snippet} ${b.tag}`.toLowerCase()
      const scoreA = keywords.reduce((acc, kw) => acc + (textA.includes(kw) ? 1 : 0), 0)
      const scoreB = keywords.reduce((acc, kw) => acc + (textB.includes(kw) ? 1 : 0), 0)
      return scoreB - scoreA
    })
  }

  const usedIds = new Set(source.map((item) => String(item.id)))
  const fillers = fallbackBooks.filter((f) => !usedIds.has(String(f.id)))
  return [...source, ...fillers].slice(0, 3)
})

function trackAffiliateEvent(campaignId: string | number, actionType: 'impression' | 'click') {
  if (!campaignId || String(campaignId).startsWith('fallback-')) return

  const payload = JSON.stringify({ campaignId, actionType })
  if (import.meta.client && navigator.sendBeacon) {
    navigator.sendBeacon('/api/ads/track', new Blob([payload], { type: 'application/json' }))
  } else {
    $fetch('/api/ads/track', {
      method: 'POST',
      body: { campaignId, actionType }
    }).catch(() => null)
  }
}

onMounted(async () => {
  try {
    const res = await $fetch<any>('/api/ads/active')
    if (res?.success && Array.isArray(res.ads) && res.ads.length > 0) {
      rawDbAds.value = res.ads.map((ad: any) => {
        const safeUrl = normalizeSafeUrl(ad.url || ad.targetUrl)
        const isAmazon = /amazon\.|amzn\./i.test(safeUrl)
        return {
          id: ad.id,
          title: ad.title,
          snippet: ad.snippet || 'Testo tecnico selezionato per approfondire lo stack.',
          url: safeUrl,
          tag: isAmazon ? 'LIBRO CONSIGLIATO' : (ad.tag || 'PARTNER'),
          provider: formatProvider(ad.provider || ad.email || ad.author, safeUrl),
          isAmazon
        }
      })
    }
  } catch (err) {
    console.warn('[DkpAdStrip] Uso fallback library:', err)
  }

  if (import.meta.client && stripRef.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !impressionsTracked.value) {
          impressionsTracked.value = true
          ads.value.forEach((ad) => trackAffiliateEvent(ad.id, 'impression'))
          observer?.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    observer.observe(stripRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const handleAdClick = (adId: string | number) => {
  trackAffiliateEvent(adId, 'click')
}
</script>

<template>
  <section ref="stripRef" class="dkp-ad-strip" aria-label="DKP Library e Link Affiliati">
    <div class="strip-header">
      <div class="header-left">
        <span class="strip-badge">📚 {{ categoryTag }}</span>
        <span class="strip-sub">Letture tecniche &amp; risorse selezionate</span>
      </div>

      <div class="header-right">
        <span class="strip-info">Affiliazione Amazon • Supporta DKP</span>
        <NuxtLink to="/shop" class="shop-link">Vedi Store →</NuxtLink>
      </div>
    </div>

    <div class="strip-grid">
      <template v-for="ad in ads" :key="ad.id">
        <!-- Rotta interna SPA (es. /shop) -->
        <NuxtLink
          v-if="ad.url.startsWith('/')"
          :to="ad.url"
          class="strip-item"
          @click="handleAdClick(ad.id)"
        >
          <div class="item-meta">
            <span class="item-tag">{{ ad.tag }}</span>
            <span class="item-provider">{{ ad.provider }}</span>
          </div>

          <h5 class="item-title">{{ ad.title }}</h5>
          <p class="item-snippet">{{ ad.snippet }}</p>

          <div class="item-footer">
            <span class="item-action">Esplora nello Shop →</span>
            <span class="privacy-tag">DKP Pick</span>
          </div>
        </NuxtLink>

        <!-- Link esterno Affiliato Amazon / Partner -->
        <a
          v-else
          :href="ad.url"
          target="_blank"
          rel="sponsored noopener noreferrer"
          class="strip-item"
          @click="handleAdClick(ad.id)"
        >
          <div class="item-meta">
            <span :class="['item-tag', ad.isAmazon ? 'tag-amazon' : '']">{{ ad.tag }}</span>
            <span class="item-provider">{{ ad.provider }}</span>
          </div>

          <h5 class="item-title">{{ ad.title }}</h5>
          <p class="item-snippet">{{ ad.snippet }}</p>

          <div class="item-footer">
            <span :class="['item-action', ad.isAmazon ? 'action-amazon' : '']">
              {{ ad.isAmazon ? 'Vedi su Amazon ↗' : 'Scopri risorsa ↗' }}
            </span>
            <span class="privacy-tag">Affiliate</span>
          </div>
        </a>
      </template>
    </div>
  </section>
</template>

<style scoped>
.dkp-ad-strip {
  background: linear-gradient(135deg, rgba(9, 13, 22, 0.98), rgba(15, 23, 42, 0.98));
  border: 1px dashed rgba(245, 158, 11, 0.38);
  border-radius: 14px;
  padding: 1.2rem 1.5rem;
  margin: 1.5rem 0;
  font-family: system-ui, sans-serif;
  box-sizing: border-box;
  max-width: 100%;
  overflow: hidden;
}

.strip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(30, 41, 59, 0.8);
  padding-bottom: 0.65rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.strip-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.strip-sub {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 600;
}

.strip-info {
  font-size: 0.68rem;
  color: #64748b;
}

.shop-link {
  font-size: 0.68rem;
  font-weight: 700;
  color: #fbbf24;
  text-decoration: none;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  padding: 0.18rem 0.5rem;
  border-radius: 5px;
  transition: all 0.2s ease;
}

.shop-link:hover {
  background: rgba(245, 158, 11, 0.2);
}

.strip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
}

.strip-item {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.25s ease;
  cursor: pointer;
  min-width: 0;
  box-sizing: border-box;
}

.strip-item:hover {
  border-color: #f59e0b;
  transform: translateY(-2.5px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.12);
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.item-tag {
  font-size: 0.6rem;
  font-weight: 800;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tag-amazon {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
}

.item-provider {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.item-snippet {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 0.5rem;
  margin-top: 0.2rem;
  font-size: 0.7rem;
}

.item-action {
  color: #00dc82;
  font-weight: 700;
}

.action-amazon {
  color: #fbbf24;
}

.privacy-tag {
  color: #475569;
}

@media (max-width: 1024px) {
  .strip-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .strip-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>