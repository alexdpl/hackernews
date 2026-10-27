<!-- app/pages/nodes/index.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'

// 🛡️ SEO Metadata ufficiale DKP
useHead({
  title: 'DKP Talks Hub — Discussioni Tecniche, Nodi & Community',
  meta: [
    { name: 'description', content: 'Esplora i DKP Nodes: discussioni verticali su Rust, JavaScript, AI Models, DevOps e Proof-of-Code con gamification integrata.' }
  ]
})

const activeSort = ref<'hot' | 'new' | 'top'>('hot')
const selectedNodeSlug = ref<string | null>(null)
const isModalOpen = ref(false)

const newPostTitle = ref('')
const newPostContent = ref('')
const newPostNodeId = ref<number | null>(null)
const newPostVaultHash = ref('')
const isSubmitting = ref(false)

const { currentUser } = useAuthCore()

const { data: nodesRes } = await useFetch('/api/nodes')
const nodes = computed(() => nodesRes.value?.data || [])

const { data: postsRes, pending: loadingPosts, refresh: refreshPosts } = await useFetch('/api/nodes/posts', {
  query: computed(() => ({
    sort: activeSort.value,
    nodeSlug: selectedNodeSlug.value || undefined
  }))
})

const posts = computed(() => postsRes.value?.posts || [])

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
  <div class="min-h-screen bg-[#060911] text-slate-100 font-sans p-4 md:p-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-8">
      
      <!-- 🌟 HEADER INTRODUTTIVO (STILE DKP EDITORIAL HUB) -->
      <div class="flex flex-col items-center text-center py-6 px-4 bg-[#090d16] border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-hidden">
        <!-- Glow accent di sfondo -->
        <div class="absolute top-0 w-96 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            DKP TALKS HUB V2.5
          </span>
        </div>

        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
          DKP <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Talks &amp; Nodes</span>
        </h1>

        <p class="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed mb-6">
          Spazio di discussione verticale per sviluppatori. Condividi snippet, analizza architetture cloud, partecipa ai nodi tematici e guadagna XP certificati nel network.
        </p>

        <button 
          @click="isModalOpen = true"
          class="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>💬</span> Apri Nuovo Thread (+25 XP)
        </button>
      </div>

      <!-- GRIGLIA A 3 COLONNE (1 SINISTRA MENU+ADS | 2 CENTRO FEED) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- 1. SIDEBAR SINISTRA: LISTA NODI + BANNER ADS & RELATED SOTTO -->
        <aside class="lg:col-span-1 flex flex-col gap-6">
          <div class="bg-[#090d16] border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h2 class="text-sm font-bold tracking-wider text-slate-300 font-mono uppercase flex items-center gap-2">
                <span class="text-sky-400">🌐</span> DKP Nodes
              </h2>
              <span class="text-[10px] bg-sky-500/10 text-sky-400 font-mono px-2 py-0.5 rounded border border-sky-500/20 font-bold">
                v2.5
              </span>
            </div>

            <nav class="flex flex-col gap-1.5 font-mono text-xs">
              <button 
                @click="selectNode(null)"
                class="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                :class="selectedNodeSlug === null ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
              >
                <span class="flex items-center gap-2">🔥 Feed Globale</span>
              </button>

              <button 
                v-for="node in nodes" 
                :key="node.id"
                @click="selectNode(node.slug)"
                class="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                :class="selectedNodeSlug === node.slug ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
              >
                <span class="flex items-center gap-2 truncate">
                  <span>{{ node.icon }}</span>
                  <span class="truncate">{{ node.name }}</span>
                </span>
                <span class="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {{ node.subscribersCount }}
                </span>
              </button>
            </nav>

            <button 
              @click="isModalOpen = true"
              class="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+</span> Nuovo Thread (+25 XP)
            </button>
          </div>

          <!-- ADS & RELATED SOTTO IL MENU A SINISTRA -->
          <DKPAdBanner />
          <DKPRelatedThreads :currentNodeSlug="selectedNodeSlug || undefined" />
        </aside>

        <!-- 2. MAIN FEED CENTRALE (2 COLONNE PIENE) -->
        <main class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- HEADER FEED & FILTER TABS -->
          <div class="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-2 font-mono">
              <span class="text-xs text-slate-400">Ordinamento:</span>
              <div class="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button 
                  @click="activeSort = 'hot'"
                  class="px-3 py-1 rounded-md font-bold transition-all"
                  :class="activeSort === 'hot' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  ⚡ Hot
                </button>
                <button 
                  @click="activeSort = 'new'"
                  class="px-3 py-1 rounded-md font-bold transition-all"
                  :class="activeSort === 'new' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  🆕 New
                </button>
                <button 
                  @click="activeSort = 'top'"
                  class="px-3 py-1 rounded-md font-bold transition-all"
                  :class="activeSort === 'top' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'"
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
          <div v-if="loadingPosts" class="p-12 text-center text-slate-500 font-mono text-xs bg-[#090d16] rounded-xl border border-slate-800">
            Caricamento discussioni dal network Neon...
          </div>

          <div v-else-if="posts.length === 0" class="p-12 text-center text-slate-500 font-mono text-xs bg-[#090d16] rounded-xl border border-slate-800">
            Nessun thread pubblicato in questo nodo. Sii il primo a creare una discussione!
          </div>

          <div v-else class="flex flex-col gap-4">
            <article 
              v-for="post in posts" 
              :key="post.id"
              class="bg-[#090d16] border border-slate-800/80 hover:border-sky-500/40 rounded-xl p-5 shadow-xl transition-all flex gap-4"
            >
              <!-- WIDGET KARMA VOTES -->
              <div class="flex flex-col items-center justify-start bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 font-mono text-xs h-fit min-w-[44px]">
                <button class="text-slate-500 hover:text-emerald-400 transition-colors text-sm font-bold">▲</button>
                <span class="font-extrabold my-1 text-slate-200">{{ post.karmaScore }}</span>
                <button class="text-slate-500 hover:text-rose-400 transition-colors text-sm font-bold">▼</button>
              </div>

              <!-- CONTENUTO THREAD -->
              <div class="flex-1 flex flex-col gap-2">
                <div class="flex items-center gap-2 font-mono text-[11px] text-slate-400 flex-wrap">
                  <span class="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {{ post.nodeIcon }} {{ post.nodeName }}
                  </span>
                  <span>•</span>
                  <span class="text-slate-300 font-semibold">@{{ post.authorUsername }}</span>
                  <span>•</span>
                  <span>{{ new Date(post.createdAt).toLocaleDateString('it-IT') }}</span>
                  <span v-if="post.vaultHash" class="ml-auto text-purple-400 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    🛡️ VAULT CERTIFIED
                  </span>
                </div>

                <NuxtLink :to="`/nodes/thread/${post.id}`" class="text-base font-bold text-slate-100 hover:text-sky-400 transition-colors">
                  {{ post.title }}
                </NuxtLink>

                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {{ post.content }}
                </p>

                <div class="flex items-center gap-4 mt-2 pt-2 border-t border-slate-800/50 font-mono text-[11px] text-slate-400">
                  <NuxtLink :to="`/nodes/thread/${post.id}`" class="hover:text-slate-200 transition-colors flex items-center gap-1.5">
                    💬 {{ post.commentsCount }} Commenti
                  </NuxtLink>
                </div>
              </div>
            </article>
          </div>
        </main>

      </div>
    </div>

    <!-- MODALE CREAZIONE THREAD -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-[#090d16] border border-sky-400/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4 font-sans">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-mono text-sm font-bold text-white flex items-center gap-2">
            <span>🚀</span> Pubblica Nuovo Thread nei DKP Nodes
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-rose-400 font-bold text-sm">✕</button>
        </div>

        <div class="flex flex-col gap-3 font-mono text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Seleziona Nodo:</label>
            <select v-model="newPostNodeId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-sky-400 outline-none">
              <option v-for="node in nodes" :key="node.id" :value="node.id">
                {{ node.icon }} {{ node.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Titolo Thread:</label>
            <input v-model="newPostTitle" type="text" placeholder="Es. Come ottimizzare l'allocazione memoria in Rust..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-sky-400 outline-none">
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Contenuto (Supporta DKP Markdown):</label>
            <textarea v-model="newPostContent" rows="5" placeholder="Scrivi il corpo della discussione o incolla il tuo snippet..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-sky-400 outline-none"></textarea>
          </div>

          <div>
            <label class="block text-slate-400 mb-1">Vault SHA-256 Hash (Opzionale):</label>
            <input v-model="newPostVaultHash" type="text" placeholder="Incolla l'hash del DKP Vault per certificarne l'autenticità" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-sky-400 outline-none">
          </div>
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-slate-800">
          <span class="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            ⚡ Inviando questo post riceverai +25 XP!
          </span>
          <div class="flex gap-2">
            <button @click="isModalOpen = false" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-xl">Annulla</button>
            <button @click="handleCreatePost" :disabled="isSubmitting" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              {{ isSubmitting ? 'Invio in corso...' : 'Pubblica Thread' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>