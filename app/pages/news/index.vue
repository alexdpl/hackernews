<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DkpHomeTelemetry from '~/components/DkpHomeTelemetry.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

const route = useRoute()

useDkpSeo({
  title: 'DKP News & Crawler AI \u2014 Stream Tecnologico Sentinel | DevKernelPulse',
  description: 'Notizie tecnologiche in tempo reale filtrate e tradotte da Trinity AI, validate da Sentinel Score e archiviate su Neon Pure SQL.',
  type: 'collection',
  canonicalPath: '/news'
})

const heroCards = [
  {
    to: '/news',
    icon: '\uD83E\uDD16',
    badge: 'ACTIVE STREAM',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    title: 'DKP News & Crawler AI',
    desc: 'Segnali tech HN + Reddit + Jobs IT filtrati e tradotti da Trinity AI'
  },
  {
    to: '/nodes',
    icon: '\uD83D\uDCAC',
    badge: 'COMMUNITY',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    title: 'DKP Talks Hub',
    desc: 'Nodi tematici, architetture, bounty e discussioni tecniche'
  },
  {
    to: '/tools',
    icon: '\uD83D\uDEE0\uFE0F',
    badge: 'SECURITY & DEV',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    title: 'Developer Tools',
    desc: 'Utility crittografiche, audit SAST e diagnostica per ingegneri'
  },
  {
    to: '/blog',
    icon: '\uD83D\uDCDD',
    badge: 'VAULT VERIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    title: 'DKP Editorial Hub',
    desc: 'Deep-dive tecnici con certificazione SHA-256 immutabile'
  }
]

const activeTab = ref<'top' | 'show' | 'ask' | 'jobs'>('top')
const searchQuery = ref(String(route.query.q || ''))
const copiedId = ref<string | null>(null)

const { data: newsRes, pending, refresh } = await useFetch<any>('/api/news', {
  key: () => `dkp-news-crawler-cards-${activeTab.value}`,
  query: () => ({ type: activeTab.value, page: 1, limit: 18 })
})

const rawItems = computed<any[]>(() => {
  const raw = newsRes.value
  return raw?.data || raw?.items || (Array.isArray(raw) ? raw : [])
})

const filteredItems = computed<any[]>(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return rawItems.value
  return rawItems.value.filter(
    (item: any) =>
      String(item.title || '').toLowerCase().includes(q) ||
      String(item.summary_it || '').toLowerCase().includes(q) ||
      String(item.author || '').toLowerCase().includes(q) ||
      String(item.domain || '').toLowerCase().includes(q)
  )
})

function canonicalStoryLink(item: any): string {
  return item?.slug ? `/news/${item.slug}` : `/item/${item.id}`
}

function getCardTags(item: any): string[] {
  if (Array.isArray(item?.tags) && item.tags.length > 0) {
    return item.tags.slice(0, 2).map((t: any) => String(t).replace(/^#/, ''))
  }
  const dom = String(item?.domain || '')
  if (dom && dom !== 'news.ycombinator.com') return ['Tech', dom.split('.')[0]]
  return ['HackerNews', 'Tech']
}

async function copyShareLink(item: any) {
  if (!import.meta.client) return
  const url = `${window.location.origin}${canonicalStoryLink(item)}`
  await navigator.clipboard?.writeText(url).catch(() => null)
  copiedId.value = String(item.id)
  setTimeout(() => {
    if (copiedId.value === String(item.id)) copiedId.value = null
  }, 1800)
}

watch(activeTab, () => refresh())
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative">
    <DkpHomeTelemetry />

    <!-- HERO SECTION SPECULARE ALLA HOME -->
    <section class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dkp-card border border-dkp-border font-mono text-xs text-dkp-accent font-bold mb-6 card-glow">
        <span class="text-amber-400 text-xs leading-none"></span>
        <span>DKP TECH FEED &bull; REALTIME AI CRAWLER V2.6-PURE-SQL</span>
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight m-0 mb-5">
        <span class="text-white">Segnali Tech &amp; </span>
        <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Trinity AI Newsroom
        </span>
      </h1>

      <p class="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mb-10">
        Notizie tecnologiche, repository e opportunita&apos; ingegneristiche in tempo reale arricchite con sintesi in italiano di Trinity AI, validate da Sentinel Score e archiviate su Neon PostgreSQL.
      </p>

      <!-- 4 CARD PRINCIPALI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-6">
        <NuxtLink
          v-for="card in heroCards"
          :key="card.to"
          :to="card.to"
          :class="[
            'bg-dkp-card/95 border rounded-2xl p-5 no-underline transition-all card-glow group flex flex-col justify-between gap-4',
            card.to === '/news' ? 'border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.14)]' : 'border-dkp-border hover:border-cyan-400/60'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="text-2xl">{{ card.icon }}</span>
            <span :class="['font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase', card.badgeClass]">
              {{ card.badge }}
            </span>
          </div>
          <div>
            <h2 class="text-base font-bold text-white group-hover:text-dkp-accent transition-colors flex items-center justify-between m-0 mb-1.5">
              <span>{{ card.title }}</span>
              <span class="text-slate-400 group-hover:text-dkp-accent transition-transform group-hover:translate-x-1">&rarr;</span>
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed m-0">{{ card.desc }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- 3 METRICHE KPI -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-2xl shrink-0">&#129302;</div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">Trinity AI</div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">SINTESI &amp; TRADUZIONE REALTIME</div>
          </div>
        </div>

        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/35 flex items-center justify-center text-2xl shrink-0">&#128737;&#65039;</div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">SAST 100%</div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">FILTRO ANTI-PHISHING SENTINEL</div>
          </div>
        </div>

        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center text-2xl shrink-0">&#9889;</div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold text-white font-mono">Pure SQL</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-dkp-pass border border-emerald-500/35">
                INDEXED
              </span>
            </div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">NEON POSTGRESQL STREAM</div>
          </div>
        </div>
      </div>
    </section>

    <!-- LAYOUT CON SIDEBAR + GRIGLIA CARD CRAWLER + BLOG & NODES -->
    <DkpLayout :hide-section-header="true" :show-sidebar-ads="true">
      <!-- 1. Barra Filtri + Griglia 3 Colonne Card Crawler AI -->
      <section class="space-y-4">
        <div class="bg-dkp-card/95 border border-emerald-500/30 rounded-2xl p-4 card-glow space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
              <button type="button" @click="activeTab = 'top'" :class="['px-3 py-1.5 rounded-xl font-extrabold border cursor-pointer', activeTab === 'top' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-dkp-bg text-slate-300 border-dkp-border']">
                 Tutti
              </button>
              <button type="button" @click="activeTab = 'show'" :class="['px-3 py-1.5 rounded-xl font-extrabold border cursor-pointer', activeTab === 'show' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-dkp-bg text-slate-300 border-dkp-border']">
                 Show DKP
              </button>
              <button type="button" @click="activeTab = 'ask'" :class="['px-3 py-1.5 rounded-xl font-extrabold border cursor-pointer', activeTab === 'ask' ? 'bg-violet-500 text-white border-violet-400' : 'bg-dkp-bg text-slate-300 border-dkp-border']">
                 Ask DKP
              </button>
              <button type="button" @click="activeTab = 'jobs'" :class="['px-3 py-1.5 rounded-xl font-extrabold border cursor-pointer', activeTab === 'jobs' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-dkp-bg text-slate-300 border-dkp-border']">
                 Jobs IT
              </button>
            </div>

            <button type="button" @click="() => refresh()" class="px-3 py-1.5 rounded-xl bg-dkp-bg border border-emerald-500/40 text-emerald-400 font-mono text-xs font-extrabold cursor-pointer">
               Aggiorna Stream Live
            </button>
          </div>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca per tecnologia o parola chiave (es. Rust, Docker, AI, SQL)..."
            class="w-full bg-dkp-bg border border-dkp-border focus:border-cyan-400 text-white px-3.5 py-2 rounded-xl font-mono text-xs outline-none box-border"
          />
        </div>
          <DkpAdsWidget
             placement="feedInline"
              layout="horizontal"
              :limit="3"
              :show-advertise-link="true"
           />
        <div v-if="pending && filteredItems.length === 0" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center font-mono text-xs text-emerald-400 animate-pulse">
           Caricamento card del Crawler AI dal database Pure SQL...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <article
            v-for="item in filteredItems"
            :key="item.id"
            class="bg-[#050a18]/95 border border-slate-800 hover:border-cyan-400/60 rounded-2xl p-5 card-glow transition-all flex flex-col justify-between gap-4"
          >
            <div class="space-y-3">
              <!-- Header Card: NEWS + AI 60% + pts -->
              <div class="flex items-center justify-between gap-2 font-mono text-[11px]">
                <span class="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 font-extrabold uppercase">
                  {{ item.type || 'NEWS' }}
                </span>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/35 font-bold">
                    AI {{ item.tech_score || 60 }}%
                  </span>
                  <span class="text-amber-300 font-bold"> {{ item.points || item.score || 0 }} pts</span>
                </div>
              </div>

              <!-- Titolo Card -->
              <NuxtLink
                :to="canonicalStoryLink(item)"
                class="text-base font-extrabold text-sky-400 hover:text-cyan-300 no-underline block leading-snug line-clamp-3"
              >
                {{ item.title }}
              </NuxtLink>

              <!-- Sintesi AI -->
              <p class="text-slate-300 text-xs leading-relaxed m-0 line-clamp-3">
                {{ item.summary_it || `Notizia di tendenza su Hacker News: ${item.title}` }}
              </p>
            </div>

            <div class="space-y-3 pt-1">
              <!-- Tag -->
              <div class="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span
                  v-for="tag in getCardTags(item)"
                  :key="tag"
                  class="px-2 py-0.5 rounded bg-[#081226] border border-slate-700/80 text-sky-400 font-bold"
                >
                  #{{ tag }}
                </span>
              </div>

              <!-- Footer Card -->
              <div class="pt-2.5 border-t border-slate-800/90 flex items-center justify-between gap-2 font-mono text-[11px]">
                <span class="text-slate-400 truncate max-w-[115px]">by @{{ item.author || 'hackernews' }}</span>

                <div class="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    @click="copyShareLink(item)"
                    class="text-slate-300 hover:text-white bg-transparent border-none cursor-pointer p-0 font-mono text-[11px]"
                  >
                     {{ copiedId === String(item.id) ? 'Copiato!' : 'Condividi' }}
                  </button>
                  <NuxtLink
                    :to="canonicalStoryLink(item)"
                    class="text-emerald-400 hover:text-emerald-300 font-extrabold no-underline"
                  >
                    Leggi scheda &nearr;
                  </NuxtLink>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- 2. IDENTICO ALLA HOME: Ultimi Articoli Blog & Ultime Discussioni Nodi affiancati -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DkpRelatedBlogWidget />
        <DkpRelatedNodesWidget />
      </div>

      <!-- 3. IDENTICO ALLA HOME: Circuito Approfondimenti dal Vault -->
      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
        topic="pure sql ai security architecture"
        :tags="['sql', 'ai', 'security', 'architecture']"
      />
    </DkpLayout>
  </div>
</template>