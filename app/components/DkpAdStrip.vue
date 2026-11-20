<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    layout?: 'horizontal' | 'vertical'
    categoryTag?: string
    topic?: string
    tags?: string[]
  }>(),
  {
    layout: 'horizontal',
    categoryTag: 'DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT',
    topic: '',
    tags: () => []
  }
)

interface VaultBookItem {
  id: string | number
  title: string
  snippet: string
  url: string
  tag: string
  accent: 'amber' | 'emerald' | 'cyan'
  keywords: string[]
}

function normalizeSafeUrl(rawUrl?: string): string {
  const clean = String(rawUrl || '').trim()
  if (!clean || clean === '#' || /^(javascript|data|vbscript):/i.test(clean)) {
    return '/nodes/n/blockchain-vault'
  }
  if (clean === '/vault' || clean === '/nodes/blockchain-vault') return '/nodes/n/blockchain-vault'
  if (clean === '/api-console') return '/user/dashboard?tab=api'
  return clean
}

const fallbackBooks: VaultBookItem[] = [
  {
    id: 'vault-book-1',
    title: 'Designing Data-Intensive Applications',
    snippet: 'Architetture distribuite, database Pure SQL, replicazione, partitioning e stream processing ad alte prestazioni.',
    url: '/shop',
    tag: 'SYSTEMS & SQL',
    accent: 'emerald',
    keywords: ['sql', 'database', 'postgres', 'neon', 'distributed', 'backend', 'cloud', 'architecture', 'data']
  },
  {
    id: 'vault-book-2',
    title: 'Black Hat Rust & Offensive Security',
    snippet: 'Crittografia applicata, audit SAST, analisi binaria e difesa attiva delle infrastrutture cloud-native.',
    url: '/shop',
    tag: 'SECURITY & VAULT',
    accent: 'amber',
    keywords: ['security', 'cyber', 'rust', 'sha-256', 'vault', 'sast', 'xss', 'sqli', 'crypto', 'audit']
  },
  {
    id: 'vault-book-3',
    title: 'Clean Architecture & Domain-Driven Design',
    snippet: 'Pattern modulari per mantenere sistemi complex-core disaccoppiati, testabili e scalabili nel tempo.',
    url: '/shop',
    tag: 'ARCHITECTURE',
    accent: 'cyan',
    keywords: ['clean', 'architecture', 'ddd', 'typescript', 'nuxt', 'vue', 'design', 'pattern', 'code']
  },
  {
    id: 'vault-book-4',
    title: 'AI Engineering & LLM Production Systems',
    snippet: 'Structured Outputs, agenti autonomi, RAG, pipeline di inferenza affidabili e sicurezza deterministica in produzione.',
    url: '/shop',
    tag: 'AI & AGENTS',
    accent: 'emerald',
    keywords: ['ai', 'llm', 'agent', 'sentinel', 'bemyagent', 'rag', 'ml', 'model', 'prompt']
  }
]

const rawDbAds = ref<VaultBookItem[]>([])
const stripRef = ref<HTMLElement | null>(null)
const impressionsTracked = ref(false)
let observer: IntersectionObserver | null = null

const ads = computed<VaultBookItem[]>(() => {
  const pool = [...rawDbAds.value]
  const usedIds = new Set(pool.map((item) => String(item.id)))
  for (const fb of fallbackBooks) {
    if (!usedIds.has(String(fb.id))) pool.push(fb)
  }

  const contextTokens = [
    props.topic,
    ...(props.tags || [])
  ]
    .flatMap((t) => String(t || '').toLowerCase().split(/[\s,/#_-]+/))
    .filter((k) => k.length >= 2)

  if (contextTokens.length > 0) {
    const scored = pool.map((item, idx) => {
      const haystack = `${item.title} ${item.snippet} ${item.tag} ${(item.keywords || []).join(' ')}`.toLowerCase()
      const score = contextTokens.reduce((acc, token) => acc + (haystack.includes(token) ? 2 : 0), 0)
      return { item, score, idx }
    })
    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx))
    return scored.map((s) => s.item).slice(0, 3)
  }

  return pool.slice(0, 3)
})

function getCardTheme(accent: VaultBookItem['accent']) {
  if (accent === 'amber') {
    return {
      card: 'border-amber-500/35 hover:border-cyan-400 bg-gradient-to-br from-amber-500/[0.07] via-dkp-bg/95 to-dkp-bg',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      title: 'text-amber-300 group-hover:text-cyan-400'
    }
  }
  if (accent === 'cyan') {
    return {
      card: 'border-cyan-500/35 hover:border-cyan-400 bg-gradient-to-br from-cyan-500/[0.07] via-dkp-bg/95 to-dkp-bg',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      title: 'text-cyan-300 group-hover:text-cyan-400'
    }
  }
  return {
    card: 'border-emerald-500/35 hover:border-cyan-400 bg-gradient-to-br from-emerald-500/[0.07] via-dkp-bg/95 to-dkp-bg',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    title: 'text-emerald-400 group-hover:text-cyan-400'
  }
}

function trackBookEvent(campaignId: string | number, actionType: 'impression' | 'click') {
  if (!campaignId || String(campaignId).startsWith('vault-book-')) return

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
    const res = await $fetch<any>('/api/ads/active').catch(() => null)
    const list = res?.ads || res?.data || []
    if (Array.isArray(list) && list.length > 0) {
      const accents: Array<'emerald' | 'amber' | 'cyan'> = ['emerald', 'amber', 'cyan']
      rawDbAds.value = list
        .filter((ad: any) => /amazon\.|amzn\.|book|libri|library/i.test(`${ad.url || ad.targetUrl || ''} ${ad.tag || ''} ${ad.title || ''}`))
        .map((ad: any, i: number) => {
          const safeUrl = normalizeSafeUrl(ad.url || ad.targetUrl)
          return {
            id: ad.id,
            title: ad.title,
            snippet: ad.snippet || ad.tagline || 'Approfondimento tecnico selezionato dal Vault DKP.',
            url: safeUrl,
            tag: ad.tag || 'VAULT LIBRARY',
            accent: accents[i % 3],
            keywords: String(`${ad.title} ${ad.tag || ''}`).toLowerCase().split(/\s+/)
          }
        })
    }
  } catch {}

  if (import.meta.client && stripRef.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !impressionsTracked.value) {
          impressionsTracked.value = true
          ads.value.forEach((ad) => trackBookEvent(ad.id, 'impression'))
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
  trackBookEvent(adId, 'click')
}
</script>

<template>
  <section
    ref="stripRef"
    aria-label="DKP Ads Network Approfondimenti dal Vault"
    class="w-full rounded-2xl bg-dkp-card/95 border border-cyan-500/30 p-5 card-glow font-sans"
  >
    <!-- HEADER IN CELESTE DKP + LINK LEDGER /nodes/n/blockchain-vault -->
    <div class="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-dkp-border font-mono">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_8px_#22d3ee]"></span>
        <span class="text-xs font-extrabold uppercase tracking-wider text-cyan-400 truncate">
          &#128218; <span v-html="categoryTag"></span>
        </span>
      </div>

      <NuxtLink
        to="/nodes/n/blockchain-vault"
        class="text-xs font-bold text-cyan-400 hover:text-white no-underline transition-colors shrink-0"
      >
        Vault Ledger &rarr;
      </NuxtLink>
    </div>

    <!-- GRIGLIA ORIZZONTALE O VERTICALE (3 CARD COLORATE) -->
    <div
      :class="[
        layout === 'horizontal'
          ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
          : 'flex flex-col gap-3'
      ]"
    >
      <template v-for="ad in ads" :key="ad.id">
        <!-- Rotta interna SPA -->
        <NuxtLink
          v-if="ad.url.startsWith('/')"
          :to="ad.url"
          :class="[
            'border rounded-xl p-4 no-underline transition-all flex flex-col justify-between gap-3 group shadow-md',
            getCardTheme(ad.accent).card
          ]"
          @click="handleAdClick(ad.id)"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5 font-mono">
              <span :class="['text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', getCardTheme(ad.accent).badge]">
                {{ ad.tag }}
              </span>
              <span class="text-[9px] text-slate-400 uppercase font-bold">Vault Pick</span>
            </div>

            <h4 :class="['text-sm font-extrabold transition-colors m-0 mb-1.5 leading-snug line-clamp-2', getCardTheme(ad.accent).title]">
              {{ ad.title }}
            </h4>

            <p class="text-xs text-slate-300 m-0 leading-relaxed line-clamp-3">
              {{ ad.snippet }}
            </p>
          </div>

          <div class="pt-2.5 border-t border-dkp-border/80 flex items-center justify-between font-mono text-[11px] font-bold text-emerald-400 group-hover:text-cyan-400 transition-colors">
            <span>Approfondisci</span>
            <span>&rarr;</span>
          </div>
        </NuxtLink>

        <!-- Link esterno -->
        <a
          v-else
          :href="ad.url"
          target="_blank"
          rel="sponsored noopener noreferrer"
          :class="[
            'border rounded-xl p-4 no-underline transition-all flex flex-col justify-between gap-3 group shadow-md',
            getCardTheme(ad.accent).card
          ]"
          @click="handleAdClick(ad.id)"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5 font-mono">
              <span :class="['text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', getCardTheme(ad.accent).badge]">
                {{ ad.tag }}
              </span>
              <span class="text-[9px] text-slate-400 uppercase font-bold">Vault Pick</span>
            </div>

            <h4 :class="['text-sm font-extrabold transition-colors m-0 mb-1.5 leading-snug line-clamp-2', getCardTheme(ad.accent).title]">
              {{ ad.title }}
            </h4>

            <p class="text-xs text-slate-300 m-0 leading-relaxed line-clamp-3">
              {{ ad.snippet }}
            </p>
          </div>

          <div class="pt-2.5 border-t border-dkp-border/80 flex items-center justify-between font-mono text-[11px] font-bold text-emerald-400 group-hover:text-cyan-400 transition-colors">
            <span>Approfondisci</span>
            <span>&nearr;</span>
          </div>
        </a>
      </template>
    </div>
  </section>
</template>