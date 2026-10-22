<!-- app/pages/[feed]/[page].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()

const feedType = computed(() => (route.params.feed as string) || 'news')
const pageNumber = computed(() => parseInt(route.params.page as string) || 1)
const itemsPerPage = 15

// Intestazione e metadati dinamici in base alla sezione
const headerInfo = computed(() => {
  switch (feedType.value.toLowerCase()) {
    case 'ask':
      return {
        title: 'Ask DKP Community',
        badge: 'Q&A v2.5',
        subtitle: 'Domande architetturali, dubbi tecnici e discussioni aperte della community.',
        actionText: '⚡ Fai una domanda (+15 XP)',
        actionUrl: '/submit?type=ask'
      }
    case 'show':
      return {
        title: 'Show DKP Projects',
        badge: 'Showcase v2.5',
        subtitle: 'Progetti Open Source, snippet e repository condivisi dagli sviluppatori.',
        actionText: '🚀 Mostra Progetto (+20 XP)',
        actionUrl: '/submit?type=show'
      }
    case 'jobs':
      return {
        title: 'Tech Jobs Hub',
        badge: 'Remote v2.5',
        subtitle: 'Opportunità lavorative tech e posizioni da remoto verificate dal DKP Crawler.',
        actionText: '💼 Pubblica Offerta (+25 XP)',
        actionUrl: '/submit?type=job'
      }
    default:
      return {
        title: 'Tech News Feed',
        badge: 'v2.5-GOLD',
        subtitle: 'Ultime notizie e articoli dal web raccolti in tempo reale in ordine cronologico.',
        actionText: '⚡ Invia Post (+15 XP)',
        actionUrl: '/submit?type=link'
      }
  }
})

useHead({
  title: computed(() => `${headerInfo.value.title} | DevKernelPulse`)
})

// Chiamata all'endpoint multi-fonte /api/hn/items con limite 15
const { data: response, error } = await useFetch('/api/hn/items', {
  query: {
    section: feedType,
    page: pageNumber,
    limit: itemsPerPage
  },
  watch: [feedType, pageNumber]
})

const items = computed(() => response.value?.data || [])
const pagination = computed(() => ({
  totalPages: response.value?.totalPages || 1
}))

// Recupero articoli per il Vault
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli in evidenza:', err)
  }
})

// Utility per estrarre il dominio pulito dai link esterni
const getDomain = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace('www.', '')
  } catch {
    return 'web'
  }
}
</script>

<template>
  <div class="view cyberpunk-container p-4 max-w-5xl mx-auto">
    
    <!-- HEADER DINAMICO IN BASE ALLA SEZIONE -->
    <div class="feed-header flex justify-between items-center pb-4 mb-6 border-b border-gray-800 flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-black text-white flex items-center gap-3">
          {{ headerInfo.title }}
          <span class="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-mono font-bold">
            {{ headerInfo.badge }}
          </span>
        </h1>
        <p class="text-gray-400 text-sm mt-1">
          {{ headerInfo.subtitle }}
        </p>
      </div>

      <NuxtLink 
        :to="headerInfo.actionUrl" 
        class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-lg transition-all shadow-[0_0_15px_rgba(0,220,130,0.2)]"
      >
        {{ headerInfo.actionText }}
      </NuxtLink>
    </div>

    <!-- MESSAGGIO ERRORE -->
    <div v-if="error" class="error-msg p-4 bg-red-900/40 text-red-300 rounded border border-red-700">
      Errore nel caricamento dei feed multi-fonte dal crawler.
    </div>

    <!-- MESSAGGIO EMPTY STATE -->
    <div v-else-if="!items || items.length === 0" class="empty-msg p-12 text-center text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800">
      <div class="text-3xl mb-2">📭</div>
      <p>Nessun contenuto presente in questa sezione.</p>
    </div>

    <!-- LISTA ELEMENTI FEED MULTI-FONTE -->
    <div v-else class="item-list">
      <ul class="space-y-3">
        <li 
          v-for="(item, index) in items" 
          :key="item.id" 
          class="news-item flex items-center justify-between p-3.5 bg-gray-900/60 rounded-xl border border-gray-800 hover:border-emerald-500/40 transition"
        >
          <div class="flex items-start space-x-3">
            <!-- 🟢 Calcolo Indice aggiornato a 15 -->
            <span class="index text-emerald-400 font-mono font-bold">{{ ((pageNumber - 1) * itemsPerPage) + index + 1 }}.</span>
            
            <div class="main-text">
              <a :href="item.link" target="_blank" class="title-link text-gray-100 font-semibold hover:text-emerald-400 transition">
                {{ item.title }}
              </a>
              <span class="url-domain text-xs text-gray-400 ml-2">
                ({{ getDomain(item.link) }})
              </span>
              
              <div class="text-xs text-gray-400 mt-1 flex items-center space-x-2 font-mono flex-wrap">
                <span class="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  📡 {{ item.sourceName }}
                </span>
                <span>•</span>
                <span>👤 {{ item.author || 'community' }}</span>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- BARRA DI PAGINAZIONE -->
      <div class="pagination-bar flex justify-between items-center mt-8 pt-4 border-t border-gray-800 text-sm">
        <NuxtLink 
          v-if="pageNumber > 1" 
          :to="`/${feedType}/${pageNumber - 1}`" 
          class="px-4 py-2 bg-gray-900 border border-gray-800 text-emerald-400 font-bold rounded-lg hover:border-emerald-500 transition"
        >
          ← Precedente
        </NuxtLink>
        <span v-else></span>

        <span class="text-gray-400 font-mono">Pagina <strong class="text-emerald-400">{{ pageNumber }}</strong> di {{ pagination.totalPages }}</span>

        <NuxtLink 
          v-if="pageNumber < pagination.totalPages" 
          :to="`/${feedType}/${pageNumber + 1}`" 
          class="px-4 py-2 bg-gray-900 border border-gray-800 text-emerald-400 font-bold rounded-lg hover:border-emerald-500 transition"
        >
          Successiva →
        </NuxtLink>
        <span v-else></span>
      </div>
    </div>

    <!-- 🟢 SEZIONE VAULT (Incrocio Dati) -->
    <div v-if="featuredArticles.length > 0" class="vault-recommended-section mt-8 pt-6 border-t border-gray-800">
      <h3 class="text-lg font-black text-white mb-4">🔗 Approfondimenti dal Vault</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink 
          v-for="art in featuredArticles" 
          :key="art.id" 
          :to="`/blog/${art.slug || art.id}`"
          class="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-emerald-500/50 transition flex flex-col gap-2"
        >
          <span class="text-[0.65rem] font-bold text-emerald-400 uppercase">{{ art.categoryName || art.category || 'Tech' }}</span>
          <h4 class="text-gray-100 font-bold text-sm">{{ art.title }}</h4>
          <span class="text-sky-400 text-xs font-bold mt-1">Leggi articolo ➔</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 🟢 BANNER DKP ADS STRIP -->
    <DkpAdStrip :categoryTag="`DKP ${feedType.toUpperCase()} SPONSORED FEED`" />

  </div>
</template>

<style scoped>
.view {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>