<!-- app/pages/nodes/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

// 🛡️ SEO Metadata ufficiale DKP v2.6
useHead({
  title: 'DKP Talks Hub — Discussioni Tecniche, Nodi & Community v2.6-PURE-SQL',
  meta: [
    { name: 'description', content: 'Esplora i DKP Nodes: discussioni verticali su Rust, JavaScript, AI Models, DevOps e Proof-of-Code con gamification integrata.' }
  ]
})

const activeSort = ref<'hot' | 'new' | 'top'>('hot')
const selectedNodeSlug = ref<string | null>(null)
const isModalOpen = ref(false)
const searchNodeQuery = ref('')

const newPostTitle = ref('')
const newPostContent = ref('')
const newPostNodeId = ref<number | null>(null)
const newPostVaultHash = ref('')
const isSubmitting = ref(false)

const { currentUser } = useAuthCore()

// Recupero Nodi dal backend
const { data: nodesRes } = await useFetch('/api/nodes')
const nodes = computed(() => nodesRes.value?.data || [])

// Raggruppamento dinamico per Categoria/Macro-Nodo (Gestione 163+ Nodi)
const groupedNodes = computed(() => {
  const groups: Record<string, any[]> = {}
  
  nodes.value.forEach((node: any) => {
    const category = node.category || node.groupName || 'Generale'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(node)
  })
  
  return groups
})

// Nodi filtrati per la ricerca veloce
const filteredNodes = computed(() => {
  if (!searchNodeQuery.value.trim()) return nodes.value
  const q = searchNodeQuery.value.toLowerCase()
  return nodes.value.filter((n: any) => 
    n.name.toLowerCase().includes(q) || 
    n.slug.toLowerCase().includes(q) ||
    (n.category && n.category.toLowerCase().includes(q))
  )
})

// Fetch discussioni
const { data: postsRes, pending: loadingPosts, refresh: refreshPosts } = await useFetch('/api/nodes/posts', {
  query: computed(() => ({
    sort: activeSort.value,
    nodeSlug: selectedNodeSlug.value || undefined
  }))
})

const posts = computed(() => postsRes.value?.posts || [])

// 🟢 Recupero 4 articoli dal Vault (Grid 4 schede)
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts').catch(() => null)
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    if (raw && raw.length > 0) {
      featuredArticles.value = raw.slice(0, 4)
    } else {
      populateFallbackArticles()
    }
  } catch (err) {
    console.error('Errore recupero articoli Vault:', err)
    populateFallbackArticles()
  }
})

function populateFallbackArticles() {
  featuredArticles.value = [
    { id: 1, title: 'Guida all\'Architettura Nuxt 4 & Rolldown', category: 'Cloud Native & DevOps', categoryName: 'DevOps', slug: 'nuxt-4-rolldown' },
    { id: 2, title: 'Integrazione Ollama e LLM Locali in Vue 3', category: 'AI & Machine Learning', categoryName: 'AI / LLM', slug: 'ollama-vue3' },
    { id: 3, title: 'Notarizzazione Codice & Hashing SHA-256', category: 'Cybersecurity & Vault', categoryName: 'Security', slug: 'vault-sha256' },
    { id: 4, title: 'Telemetria SSE Live & Worker Nitro v2.6', category: 'Backend Architecture', categoryName: 'Backend', slug: 'sse-nitro-v26' }
  ]
}

watch(nodes, (val) => {
  if (val.length > 0 && !newPostNodeId.value) {
    newPostNodeId.value = val[0].id
  }
}, { immediate: true })

async function handleCreatePost() {
  if (!newPostNodeId.value || !newPostTitle.value.trim() || !newPostContent.value.trim()) {
    alert('Compila tutti i campi obbligatori.')
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/nodes/posts', {
      method: 'POST',
      body: {
        nodeId: newPostNodeId.value,
        title: newPostTitle.value,
        content: newPostContent.value,
        vaultHash: newPostVaultHash.value || null,
        userId: currentUser.value?.id
      }
    })

    if (res && res.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
      }
      
      newPostTitle.value = ''
      newPostContent.value = ''
      newPostVaultHash.value = ''
      isModalOpen.value = false
      refreshPosts()
    }
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Errore durante la pubblicazione del thread.')
  } finally {
    isSubmitting.value = false
  }
}

function selectNode(slug: string | null) {
  selectedNodeSlug.value = slug
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans p-4 md:p-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-8">
      
      <!-- 🌟 HERO HEADER CON 3 BOTTONI ECOSYSTEM E BADGE V2.6 -->
      <section class="relative py-8 px-6 text-center flex flex-col items-center gap-5 bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        <!-- Glow Sfondo -->
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div class="inline-flex items-center gap-2 bg-[#020420] border border-purple-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <span class="text-[11px] font-mono font-black text-purple-400 uppercase tracking-widest">
            DKP TALKS HUB v2.6-PURE-SQL
          </span>
        </div>

        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
          DKP <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-400 to-emerald-400">Talks &amp; Nodes</span>
        </h1>

        <p class="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed font-sans">
          Spazio di discussione verticale per sviluppatori. Condividi snippet, analizza architetture cloud, partecipa ai nodi tematici e guadagna XP certificati nel network.
        </p>

       <!-- PULSANTI PRINCIPALI DELL'ECOSISTEMA (4 PILASTRI v2.6-PURE-SQL) -->
<div class="flex flex-wrap gap-3 justify-center mb-8 relative z-10 font-mono">
  <NuxtLink
    to="/news"
    active-class="!bg-emerald-500 !text-slate-950 !border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
    class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
  >
    🌍 DKP Tech Feed
  </NuxtLink>

  <NuxtLink
    to="/nodes"
    active-class="!bg-purple-500 !text-slate-950 !border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
    class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
  >
    💬 DKP Talks Hub
  </NuxtLink>

  <NuxtLink
    to="/tools"
    active-class="!bg-sky-400 !text-slate-950 !border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
    class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
  >
    🛠️ Developer Tools
  </NuxtLink>

  <NuxtLink
    to="/blog"
    active-class="!bg-emerald-500 !text-slate-950 !border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
    class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all shadow-lg"
  >
    ✍️ DKP Editorial Hub
  </NuxtLink>
</div>

        <!-- Pulsante Creazione Thread -->
        <button 
          @click="isModalOpen = true"
          class="mt-3 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>💬</span> Apri Nuovo Thread (+25 XP)
        </button>
      </section>

      <!-- GRIGLIA A 2 COLONNE (1 SINISTRA MENU TENDINA NODI | 2 CENTRO FEED) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- 1. SIDEBAR SINISTRA: MENU A TENDINA COMPATTO NODI + BANNER ADS -->
        <aside class="lg:col-span-1 flex flex-col gap-6">
          <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 class="text-sm font-bold tracking-wider text-white font-mono uppercase flex items-center gap-2">
                <span class="text-purple-400">🌐</span> Navigazione Nodi
              </h2>
              <span class="text-[10px] bg-purple-500/10 text-purple-400 font-mono px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                163+ Nodi
              </span>
            </div>

            <!-- MENU A TENDINA (SELECT DROPDOWN PER 163 NODI) -->
            <div class="flex flex-col gap-2 font-mono text-xs">
              <label class="text-slate-400 text-[11px] font-bold">Seleziona Nodo Rapido:</label>
              <select 
                :value="selectedNodeSlug || ''" 
                @change="selectNode(($event.target as HTMLSelectElement).value || null)"
                class="w-full bg-[#020420] border border-slate-800 hover:border-purple-500/40 rounded-xl p-3 text-slate-200 focus:border-purple-400 outline-none transition-all cursor-pointer font-sans"
              >
                <option value="">🔥 Feed Globale (Tutti i nodi)</option>
                <optgroup v-for="(nodeList, catName) in groupedNodes" :key="catName" :label="catName">
                  <option v-for="node in nodeList" :key="node.id" :value="node.slug">
                    {{ node.icon }} {{ node.name }} ({{ node.subscribersCount || 0 }})
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- SEARCH FILTER PER CERCARE FRA I NODI -->
            <div class="flex flex-col gap-2 font-mono text-xs">
              <input 
                v-model="searchNodeQuery" 
                type="text" 
                placeholder="🔎 Filtra nodi o argomenti..." 
                class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none text-xs"
              />
            </div>

            <!-- ALBERO NODI ESPANDIBILE COMPATTO -->
            <div class="max-h-72 overflow-y-auto pr-1 flex flex-col gap-1 font-mono text-xs custom-scrollbar">
              <button 
                @click="selectNode(null)"
                class="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                :class="selectedNodeSlug === null ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
              >
                <span class="flex items-center gap-2">🔥 Feed Globale</span>
              </button>

              <button 
                v-for="node in filteredNodes" 
                :key="node.id"
                @click="selectNode(node.slug)"
                class="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                :class="selectedNodeSlug === node.slug ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
              >
                <span class="flex items-center gap-2 truncate">
                  <span>{{ node.icon }}</span>
                  <span class="truncate">{{ node.name }}</span>
                </span>
                <span class="text-[10px] text-slate-500 bg-[#020420] px-1.5 py-0.5 rounded border border-slate-800">
                  {{ node.subscribersCount || 0 }}
                </span>
              </button>
            </div>

            <button 
              @click="isModalOpen = true"
              class="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+</span> Nuovo Thread (+25 XP)
            </button>
          </div>

          <DKPAdBanner />
        </aside>

        <!-- 2. MAIN FEED CENTRALE -->
        <main class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- HEADER FEED & FILTER TABS -->
          <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-2 font-mono">
              <span class="text-xs text-slate-400">Ordinamento:</span>
              <div class="flex bg-[#020420] p-1 rounded-xl border border-slate-800 text-xs">
                <button 
                  @click="activeSort = 'hot'"
                  class="px-3 py-1 rounded-lg font-bold transition-all"
                  :class="activeSort === 'hot' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  ⚡ Hot
                </button>
                <button 
                  @click="activeSort = 'new'"
                  class="px-3 py-1 rounded-lg font-bold transition-all"
                  :class="activeSort === 'new' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  🆕 New
                </button>
                <button 
                  @click="activeSort = 'top'"
                  class="px-3 py-1 rounded-lg font-bold transition-all"
                  :class="activeSort === 'top' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  🏆 Top
                </button>
              </div>
            </div>

            <div class="font-mono text-xs text-slate-400">
              Nodo attivo: <span class="text-emerald-400 font-bold">{{ selectedNodeSlug ? `n/${selectedNodeSlug}` : 'Tutti i Nodi' }}</span>
            </div>
          </div>

          <!-- LISTA THREAD/POSTS -->
          <div v-if="loadingPosts" class="p-12 text-center text-emerald-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800 animate-pulse">
            ⚡ Ingestione discussioni dal DB Neon in corso...
          </div>

          <div v-else-if="posts.length === 0" class="p-12 text-center text-slate-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800">
            📭 Nessun thread pubblicato in questo nodo. Sii il primo a creare una discussione!
          </div>

          <div v-else class="flex flex-col gap-4">
            <article 
              v-for="post in posts" 
              :key="post.id"
              class="bg-[#090d16] border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xl transition-all flex gap-4 group"
            >
              <div class="flex flex-col items-center justify-start bg-[#020420] p-2.5 rounded-xl border border-slate-800 font-mono text-xs h-fit min-w-[44px]">
                <button class="text-slate-500 hover:text-emerald-400 transition-colors text-sm font-bold">▲</button>
                <span class="font-extrabold my-1 text-slate-200">{{ post.karmaScore || 1 }}</span>
                <button class="text-slate-500 hover:text-rose-400 transition-colors text-sm font-bold">▼</button>
              </div>

              <div class="flex-1 flex flex-col gap-2">
                <div class="flex items-center gap-2 font-mono text-[11px] text-slate-400 flex-wrap">
                  <span class="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {{ post.nodeIcon || '🌐' }} {{ post.nodeName || 'General' }}
                  </span>
                  <span>•</span>
                  <span class="text-slate-300 font-semibold">@{{ post.authorUsername || 'community' }}</span>
                  <span>•</span>
                  <span>{{ new Date(post.createdAt || Date.now()).toLocaleDateString('it-IT') }}</span>
                  <span v-if="post.vaultHash" class="ml-auto text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    🛡️ VAULT CERTIFIED
                  </span>
                </div>

                <NuxtLink :to="`/nodes/thread/${post.id}`" class="text-base font-bold text-slate-100 group-hover:text-purple-400 transition-colors font-sans leading-snug">
                  {{ post.title }}
                </NuxtLink>

                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                  {{ post.content }}
                </p>

                <div class="flex items-center gap-4 mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                  <NuxtLink :to="`/nodes/thread/${post.id}`" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold">
                    💬 {{ post.commentsCount || 0 }} Commenti
                  </NuxtLink>
                </div>
              </div>
            </article>
          </div>

          <!-- 🟢 1. DISCUSSIONI CORRELATE -->
          <div class="pt-6 border-t border-slate-800">
            <DKPRelatedThreads :currentNodeSlug="selectedNodeSlug || undefined" />
          </div>

          <!-- 🟢 2. APPROFONDIMENTI DAL VAULT (4 SCHEDE GRID) -->
          <div v-if="featuredArticles.length > 0" class="pt-6 border-t border-slate-800 flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
                <span>🔗</span> Approfondimenti dal Vault
              </h3>
              <NuxtLink to="/blog" class="text-xs font-mono font-bold text-emerald-400 hover:underline">
                Vedi tutti gli articoli ➔
              </NuxtLink>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <NuxtLink 
                v-for="art in featuredArticles" 
                :key="art.id" 
                :to="`/blog/${art.slug || art.id}`"
                class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md group text-left min-h-[160px]"
              >
                <div>
                  <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {{ art.categoryName || art.category || 'Tech' }}
                  </span>
                  <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug font-sans">
                    {{ art.title }}
                  </h4>
                </div>
                <span class="text-[11px] font-mono font-bold text-sky-400 group-hover:underline mt-4">
                  Leggi articolo ➔
                </span>
              </NuxtLink>
            </div>
          </div>

          <!-- 🟢 3. HACKER NEWS AI STREAM AL CENTRO -->
          <div class="pt-6 border-t border-slate-800">
            <DkpNodesHomeWidget />
          </div>

          <!-- BANNER AD SPONSORED -->
          <DkpAdStrip categoryTag="DKP NODES TALKS STREAM" />

        </main>
      </div>

    </div>

    <!-- MODALE CREAZIONE THREAD -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#090d16] border border-purple-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 font-sans">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-mono text-sm font-bold text-white flex items-center gap-2">
            <span>🚀</span> Pubblica Nuovo Thread nei DKP Nodes
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-rose-400 font-bold text-sm">✕</button>
        </div>

        <div class="flex flex-col gap-3 font-mono text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Seleziona Nodo (163 disponibili):</label>
            <select v-model="newPostNodeId" class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none font-sans">
              <optgroup v-for="(nodeList, catName) in groupedNodes" :key="catName" :label="catName">
                <option v-for="node in nodeList" :key="node.id" :value="node.id">
                  {{ node.icon }} {{ node.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Titolo Thread:</label>
            <input v-model="newPostTitle" type="text" placeholder="Es. Come ottimizzare l'allocazione memoria in Rust..." class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none font-sans">
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Contenuto (Supporta DKP Markdown):</label>
            <textarea v-model="newPostContent" rows="5" placeholder="Scrivi il corpo della discussione o incolla il tuo snippet..." class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none font-sans"></textarea>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Vault SHA-256 Hash (Opzionale):</label>
            <input v-model="newPostVaultHash" type="text" placeholder="Incolla l'hash del DKP Vault per certificarne l'autenticità" class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-purple-400 outline-none">
          </div>
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-slate-800">
          <span class="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            ⚡ Inviando questo post riceverai +25 XP!
          </span>
          <div class="flex gap-2 font-mono">
            <button @click="isModalOpen = false" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl">Annulla</button>
            <button @click="handleCreatePost" :disabled="isSubmitting" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              {{ isSubmitting ? 'Invio in corso...' : 'Pubblica Thread' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>