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
    categoryTag: 'DKP DEV LIBRARY &bull; LIBRI & RISORSE CONSIGLIATE',
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
  isAmazon: boolean
}

function normalizeBookUrl(rawUrl?: string): string {
  const clean = String(rawUrl || '').trim()
  if (!clean || clean === '#' || /^(javascript|data|vbscript):/i.test(clean)) {
    return '/user/ads'
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
    url: 'https://www.amazon.it/s?k=Designing+Data-Intensive+Applications',
    tag: 'SYSTEMS & SQL',
    accent: 'emerald',
    keywords: ['sql', 'database', 'postgres', 'neon', 'distributed', 'backend', 'cloud', 'architecture', 'data'],
    isAmazon: true
  },
  {
    id: 'vault-book-2',
    title: 'Clean Architecture & Domain-Driven Design',
    snippet: 'Pattern modulari per mantenere sistemi complex-core disaccoppiati, testabili e scalabili nel tempo.',
    url: 'https://www.amazon.it/s?k=Clean+Architecture+Robert+Martin',
    tag: 'ARCHITECTURE',
    accent: 'cyan',
    keywords: ['clean', 'architecture', 'ddd', 'typescript', 'nuxt', 'vue', 'design', 'pattern', 'code'],
    isAmazon: true
  },
  {
    id: 'vault-book-3',
    title: 'AI Engineering & LLM Production Systems',
    snippet: 'Structured Outputs, agenti autonomi, RAG, pipeline di inferenza affidabili e sicurezza deterministica in produzione.',
    url: 'https://www.amazon.it/s?k=AI+Engineering+Chip+Huyen',
    tag: 'AI & AGENTS',
    accent: 'amber',
    keywords: ['ai', 'llm', 'agent', 'sentinel', 'bemyagent', 'rag', 'ml', 'model', 'prompt'],
    isAmazon: true
  }
]

const { data: activeRes, refresh: refreshBooks } = await useFetch<any>('/api/ads/active', {
  key: () => 'dkp-affiliate-books-' + props.layout + '-' + (props.topic || 'default'),
  server: false,
  lazy: true,
  default: () => ({ ok: true, ads: [] })
})

const rawDbAds = computed<VaultBookItem[]>(() => {
  const rows = activeRes.value?.ads
  if (!Array.isArray(rows)) return []
  return rows.map((row: any, idx: number): VaultBookItem => {
    const url = normalizeBookUrl(row.url || row.targetUrl)
    const isAmazon = /amazon\.|amzn\./i.test(url)
    const accents: Array<'emerald' | 'cyan' | 'amber'> = ['emerald', 'cyan', 'amber']
    return {
      id: row.id ?? ('db-book-' + idx),
      title: String(row.title || 'Libro Tecnico Consigliato'),
      snippet: String(row.snippet || row.tagline || 'Risorsa tecnica selezionata su DevKernelPulse.'),
      url,
      tag: String(row.tag || (isAmazon ? 'DEV LIBRARY' : 'PARTNER PICK')).toUpperCase(),
      accent: accents[idx % accents.length],
      keywords: Array.isArray(row.keywords) ? row.keywords : [],
      isAmazon
    }
  })
})

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

function getCardAccent(accent: VaultBookItem['accent']) {
  if (accent === 'cyan') {
    return {
      border: 'border-cyan-500/25 hover:border-cyan-400/50',
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      cta: 'text-cyan-300 hover:text-white'
    }
  }
  if (accent === 'amber') {
    return {
      border: 'border-amber-500/25 hover:border-amber-400/50',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      cta: 'text-amber-300 hover:text-white'
    }
  }
  return {
    border: 'border-emerald-500/25 hover:border-emerald-400/50',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    cta: 'text-emerald-300 hover:text-white'
  }
}

function sendTrack(id: string | number, type: 'impression' | 'click') {
  const sid = String(id || '')
  if (!sid || sid.startsWith('vault-book-')) return
  const payload = JSON.stringify({ campaignId: id, type, actionType: type })
  if (import.meta.client && navigator.sendBeacon) {
    navigator.sendBeacon('/api/ads/track', new Blob([payload], { type: 'application/json' }))
  } else {
    $fetch('/api/ads/track', { method: 'POST', body: { campaignId: id, type, actionType: type } }).catch(() => null)
  }
}

function handleAdClick(id: string | number) {
  sendTrack(id, 'click')
}

function handleRotate() {
  impressionsTracked.value = false
  refreshBooks()
}

onMounted(() => {
  if (!import.meta.client || !stripRef.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !impressionsTracked.value) {
        impressionsTracked.value = true
        ads.value.forEach((item) => sendTrack(item.id, 'impression'))
        observer?.disconnect()
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(stripRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <section
    ref="stripRef"
    aria-label="DKP Dev Library & Affiliate Picks"
    class="w-full rounded-2xl bg-dkp-card/95 border border-dkp-border p-4 font-sans"
  >
    <div class="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-dkp-border/80 font-mono">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-cyan-300 truncate" v-html="categoryTag"></span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          title="Aggiorna selezione"
          @click="handleRotate"
          class="text-xs text-slate-400 hover:text-white bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          &#8635;
        </button>

        <NuxtLink
          to="/user/ads"
          class="px-2.5 py-1 rounded-lg bg-[#050914] hover:bg-slate-900 border border-dkp-border text-slate-300 hover:text-cyan-300 font-mono text-[11px] font-bold no-underline transition-colors"
        >
          I Miei Link
        </NuxtLink>
      </div>
    </div>

    <div
      :class="[
        layout === 'horizontal'
          ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5'
          : 'flex flex-col gap-3'
      ]"
    >
      <article
        v-for="ad in ads"
        :key="ad.id"
        :class="[
          'rounded-xl bg-[#050914]/90 border p-3.5 transition-all flex flex-col justify-between group',
          getCardAccent(ad.accent).border
        ]"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2 font-mono">
            <span
              :class="[
                'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                getCardAccent(ad.accent).badge
              ]"
            >
              {{ ad.tag }}
            </span>
            <span class="text-[9px] text-slate-400 uppercase font-mono">
              {{ ad.isAmazon ? 'Partner' : 'Vault' }}
            </span>
          </div>

          <h4 class="text-xs sm:text-sm font-bold text-white leading-snug m-0 mb-1 group-hover:text-cyan-300 transition-colors">
            {{ ad.title }}
          </h4>

          <p class="text-[11px] sm:text-xs text-slate-400 leading-relaxed m-0 line-clamp-2">
            {{ ad.snippet }}
          </p>
        </div>

        <div class="mt-3 pt-2.5 border-t border-dkp-border/70 font-mono">
          <NuxtLink
            v-if="ad.url.startsWith('/')"
            :to="ad.url"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-between text-[11px] font-bold no-underline transition-colors',
              getCardAccent(ad.accent).cta
            ]"
          >
            <span>Approfondisci</span>
            <span>&rarr;</span>
          </NuxtLink>

          <a
            v-else
            :href="ad.url"
            target="_blank"
            rel="sponsored noopener noreferrer"
            @click="handleAdClick(ad.id)"
            :class="[
              'w-full inline-flex items-center justify-between text-[11px] font-bold no-underline transition-colors',
              getCardAccent(ad.accent).cta
            ]"
          >
            <span>{{ ad.isAmazon ? 'Vedi su Amazon' : 'Apri Risorsa' }}</span>
            <span>&nearr;</span>
          </a>
        </div>
      </article>
    </div>
  </section>
</template>