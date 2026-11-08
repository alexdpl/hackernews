<!-- app/components/DkpNodesHomeWidget.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface NewsItem {
  id: number | string
  title: string
  slug: string
  summary_it?: string
  hn_points: number
  tech_score: number
  type: 'show' | 'ask' | 'news'
  url?: string
}

const stories = ref<NewsItem[]>([])
const isLoading = ref(true)

async function loadHomeNewsStream() {
  isLoading.value = true
  try {
    // Chiamata all'API v2.5 con focus su Show HN e Ask HN
    const res: any = await $fetch('/api/news/stream', {
      query: { limit: 4, type: 'show,ask' }
    }).catch(() => null)

    const items = res?.data || res?.items || (Array.isArray(res) ? res : [])

    if (items.length > 0) {
      stories.value = items.map((item: any) => ({
        id: item.id || item.hn_id,
        title: item.title,
        slug: item.slug || `${item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.id}`,
        summary_it: item.summary_it || item.summary || item.excerpt || 'Analisi ed elaborazione del contenuto via Trinity AI...',
        hn_points: item.score || item.hn_points || item.points || 0,
        tech_score: item.tech_score || item.score || 85,
        type: item.type || (item.title?.toLowerCase().startsWith('show hn') ? 'show' : 'ask'),
        url: item.url
      }))
    } else {
      populateFallback()
    }
  } catch (err) {
    console.warn('[DkpNodesHomeWidget] Attivazione fallback stream:', err)
    populateFallback()
  } finally {
    isLoading.value = false
  }
}

function populateFallback() {
  stories.value = [
    {
      id: 50405263,
      title: 'Show HN: OpenUI Studio v2.5 – Playground reattivo in Tailwind CSS',
      slug: 'show-hn-openui-studio-v2-50405263',
      summary_it: 'Nuovo toolkit per la prototipazione rapida di interfacce Vue 3 con rendering nativo Tailwind e idratazione SSR azzerata.',
      hn_points: 142,
      tech_score: 95,
      type: 'show'
    },
    {
      id: 50403954,
      title: 'Ask HN: Come ottimizzare la latenza SSE in architetture Serverless Nitro?',
      slug: 'ask-hn-latenza-sse-nitro-50403954',
      summary_it: 'Discussione sulle migliori practice per la gestione di flussi Server-Sent Events ad alta frequenza con Neon DB e GCP Node instance.',
      hn_points: 89,
      tech_score: 88,
      type: 'ask'
    },
    {
      id: 50397325,
      title: 'Show HN: Sentinel AI – Moderatore ibrido con Fallback Multi-Provider',
      slug: 'show-hn-sentinel-ai-50397325',
      summary_it: 'Sistema di sicurezza euristico + LLM per la scansione semantica preventiva contro attacchi XSS e spam su piattaforme developer.',
      hn_points: 210,
      tech_score: 98,
      type: 'show'
    },
    {
      id: 50368208,
      title: 'Ask HN: Migrazione a scrypt KDF per la memorizzazione sicura delle API Key',
      slug: 'ask-hn-migrazione-scrypt-kdf-50368208',
      summary_it: 'Analisi sull\'impatto memory-hard nel calcolo dell\'hashing API Key lato server per neutralizzare rig GPU/ASIC.',
      hn_points: 115,
      tech_score: 91,
      type: 'ask'
    }
  ]
}

function getTypeBadgeColor(type: string) {
  if (type === 'show') return 'border-purple-500/40 bg-purple-500/15 text-purple-400'
  if (type === 'ask') return 'border-sky-500/40 bg-sky-500/15 text-sky-400'
  return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
}

onMounted(() => {
  loadHomeNewsStream()
})
</script>

<template>
  <section class="bg-[#090d16] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6">
    <!-- Glow accent di sfondo in alto a destra -->
    <div class="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-60 h-28 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- HEADER WIDGET -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80 relative z-10">
      <div>
        <div class="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-1 font-bold">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          DKP Nodes Live Stream
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
          Hacker News <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400">AI Threat &amp; News Stream</span>
        </h2>
      </div>

      <NuxtLink to="/news" class="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-[#020420] border border-slate-800 px-3.5 py-2 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
        <span>Vedi tutto lo Stream</span>
        <span>↗</span>
      </NuxtLink>
    </div>

    <!-- LOADER STATE -->
    <div v-if="isLoading" class="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
      <span class="animate-spin text-emerald-400">⚡</span> Caricamento notizie Show HN &amp; Ask HN in corso...
    </div>

    <!-- GRID SCHEDE NOTIZIE -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
      <article 
        v-for="item in stories" 
        :key="item.id" 
        class="bg-[#020420] border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl group"
      >
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span :class="['px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border', getTypeBadgeColor(item.type)]">
              {{ item.type === 'show' ? 'SHOW HN' : item.type === 'ask' ? 'ASK HN' : 'NEWS' }}
            </span>
            <span class="text-[11px] font-mono font-bold text-emerald-400">
              🔥 {{ item.hn_points }} pts
            </span>
          </div>

          <h3 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            <NuxtLink :to="`/news/${item.slug}`">
              {{ item.title }}
            </NuxtLink>
          </h3>

          <p class="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
            {{ item.summary_it }}
          </p>
        </div>

        <div class="pt-3 border-t border-slate-800/60 mt-4 flex items-center justify-between">
          <NuxtLink :to="`/news/${item.slug}`" class="text-[11px] font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1">
            <span>Leggi scheda</span>
            <span>↗</span>
          </NuxtLink>
          <a v-if="item.url" :href="item.url" target="_blank" class="text-[10px] font-mono text-slate-500 hover:text-sky-400 transition-colors">
            Fonte 🔗
          </a>
        </div>
      </article>
    </div>
  </section>
</template>