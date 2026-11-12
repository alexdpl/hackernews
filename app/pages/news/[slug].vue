<!-- app/pages/news/[slug].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

const route = useRoute()
const slugParam = computed(() => route.params.slug as string)

// 1. Fetch dettaglio notizia
const { data: newsRes, pending } = await useFetch(() => `/api/news/${slugParam.value}`, {
  key: `news-detail-${slugParam.value}`
})

const story = computed(() => {
  const res: any = newsRes.value
  if (!res) return null
  const payload = res.story || res.data || res.news || (Array.isArray(res) ? res[0] : res)
  if (payload && payload.title) {
    return payload
  }
  return null
})

// 2. Gestione Commenti Notizia (lazy SSR-safe)
const newCommentText = ref('')
const isSubmitting = ref(false)

const { data: commentsRes, refresh: refreshComments } = await useFetch('/api/news/comments', {
  key: `news-comments-${slugParam.value}`,
  query: computed(() => ({ slug: slugParam.value })),
  lazy: true
})

const comments = computed(() => {
  const res: any = commentsRes.value
  if (!res) return []
  return res.data || res.comments || []
})

// 3. Approfondimenti dal Vault (lazy SSR-safe)
const { data: vaultRes } = await useFetch('/api/blog/posts', {
  key: `news-slug-vault-${slugParam.value}`,
  lazy: true
})

const featuredArticles = computed(() => {
  const res: any = vaultRes.value
  const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
  return raw.slice(0, 2)
})

const copySuccess = ref(false)
function shareStory() {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
    navigator.clipboard.writeText(shareUrl)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  }
}

async function submitComment() {
  if (!newCommentText.value.trim()) return

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/news/comments', {
      method: 'POST',
      body: {
        slug: slugParam.value,
        content: newCommentText.value.trim()
      }
    })

    if (res && (res.success || res.id)) {
      newCommentText.value = ''
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
      }
      await refreshComments()
    }
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Errore durante l\'invio del commento.')
  } finally {
    isSubmitting.value = false
  }
}

function getTypeBadgeColor(type: string) {
  if (type === 'show') return 'border-purple-500/40 bg-purple-500/15 text-purple-400'
  if (type === 'ask') return 'border-sky-500/40 bg-sky-500/15 text-sky-400'
  return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
}

function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.replace(/[{}]/g, '').split(',').map(t => t.trim().replace(/^"/, '').replace(/"$/, '')).filter(Boolean)
  }
  return ['HackerNews', 'Tech']
}

useHead({
  title: computed(() => story.value ? `${story.value.title} — DKP Tech Feed v2.6` : 'Scheda Notizia AI — DevKernelPulse'),
  meta: [
    {
      name: 'description',
      content: computed(() => story.value?.summary_it || story.value?.summary || 'Analisi tecnica in tempo reale elaborata da Trinity AI su DevKernelPulse v2.6-PURE-SQL.')
    }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-10">
    <div class="max-w-5xl mx-auto flex flex-col gap-6">
      
      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- BREADCRUMB DI RITORNO -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <NuxtLink to="/news" class="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1.5 w-fit font-bold">
          ← Torna al DKP Tech Feed
        </NuxtLink>
        <span class="text-[11px] font-mono text-slate-500">v2.6-PURE-SQL · TRINITY AI NODE</span>
      </div>

      <!-- STATE: LOADING PRINCIPALE -->
      <div v-if="pending" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Analisi della notizia da parte di Trinity AI in corso...
      </div>

      <!-- STATE: SCHEDA NOTIZIA -->
      <template v-else-if="story">
        <div class="flex flex-col gap-8">
          
          <!-- CARD PRINCIPALE NOTIZIA -->
          <article class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="flex items-center justify-between gap-4 flex-wrap relative z-10 pb-4 border-b border-slate-800/80">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span :class="['px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono', getTypeBadgeColor(story.type)]">
                  {{ story.type === 'show' ? 'SHOW HN' : story.type === 'ask' ? 'ASK HN' : 'NEWS' }}
                </span>
                <span class="text-xs font-mono font-bold text-emerald-400 bg-[#020420] px-3 py-1 rounded-md border border-emerald-500/20 shadow-inner">
                  🔥 {{ story.points || 0 }} pts
                </span>
                <span v-if="story.techScore" class="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                  🛡️ Sentinel Score: {{ story.techScore }}%
                </span>
              </div>

              <span class="text-xs font-mono text-slate-400">
                by @{{ story.author || 'hackernews' }}
              </span>
            </div>

            <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight relative z-10">
              {{ story.title }}
            </h1>

            <!-- ANALISI TRINITY AI -->
            <div class="bg-[#020420] border border-emerald-500/30 rounded-xl p-5 sm:p-6 relative z-10 flex flex-col gap-3 shadow-inner">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  Sintesi &amp; Analisi Trinity AI
                </div>
                <span class="text-[10px] font-mono text-slate-500 uppercase">Pure SQL Indexed</span>
              </div>
              <p class="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                {{ story.summary_it || story.summary || 'Notizia di tendenza analizzata dal motore Trinity AI, focalizzata sull\'impatto tecnologico e architetturale.' }}
              </p>
            </div>

            <!-- METADATI, TAGS, LINK ORIGINALE & SHARE -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-800/80 relative z-10">
              <div class="flex flex-wrap gap-1.5">
                <span v-for="tag in parseTags(story.tags)" :key="tag" class="text-xs font-mono bg-[#020420] text-sky-400 border border-slate-800 px-2.5 py-1 rounded-lg">
                  #{{ tag }}
                </span>
              </div>

              <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button 
                  type="button"
                  @click="shareStory"
                  class="px-4 py-2.5 bg-[#020420] text-slate-300 border border-slate-700 hover:border-emerald-500/50 font-mono text-xs rounded-xl hover:text-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Copia link della scheda DKP per condivisione"
                >
                  <span>🔗 {{ copySuccess ? 'Link Copiato!' : 'Condividi Scheda' }}</span>
                </button>

                <a 
                  v-if="story.url" 
                  :href="story.url" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="px-5 py-2.5 bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  <span>Leggi fonte originale</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </article>

          <!-- FORM COMMENTI & GAMIFICATION -->
          <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 font-mono text-xs">
            <label class="font-bold text-slate-200 flex items-center justify-between">
              <span>💬 Discussione &amp; Opinion:</span>
              <span class="text-emerald-400 font-normal text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">+10 XP</span>
            </label>
            <textarea 
              v-model="newCommentText" 
              rows="3" 
              placeholder="Esprimi la tua opinione o aggiungi contesto tecnico a questa notizia..." 
              class="w-full bg-[#020420] border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:border-emerald-400 outline-none transition-all font-sans text-sm"
            ></textarea>
            <div class="flex justify-end">
              <button 
                type="button"
                @click="submitComment" 
                :disabled="isSubmitting || !newCommentText.trim()"
                class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                {{ isSubmitting ? 'Invio in corso...' : 'Invia Commento (+10 XP)' }}
              </button>
            </div>
          </section>

          <!-- ELENCO COMMENTI -->
          <section class="flex flex-col gap-4">
            <h3 class="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Commenti Community ({{ comments.length }})
            </h3>

            <div v-if="comments.length === 0" class="p-8 text-center font-mono text-xs text-slate-500 bg-[#090d16] rounded-2xl border border-slate-800/80 italic">
              Nessun commento ancora. Condividi per primo la tua opinione!
            </div>

            <div v-else class="flex flex-col gap-3">
              <div 
                v-for="c in comments" 
                :key="c.id" 
                class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs hover:border-emerald-500/30 transition-colors"
              >
                <div class="flex items-center justify-between text-slate-400 text-[11px]">
                  <span class="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">@{{ c.authorUsername || c.author || 'dev_kernel' }}</span>
                  <span>{{ new Date(c.createdAt || Date.now()).toLocaleDateString('it-IT') }}</span>
                </div>
                <p class="text-slate-200 text-sm font-sans leading-relaxed mt-1">
                  {{ c.content }}
                </p>
              </div>
            </div>
          </section>

          <!-- APPROFONDIMENTI DAL VAULT & WIDGET -->
          <div v-if="featuredArticles.length > 0" class="pt-8 border-t border-slate-800 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
                <span>🔗</span> Approfondimenti dal Vault Editorial Hub
              </h3>
              <NuxtLink to="/blog" class="text-xs font-mono text-emerald-400 hover:underline font-bold">
                Esplora Blog ➔
              </NuxtLink>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NuxtLink 
                v-for="art in featuredArticles" 
                :key="art.id" 
                :to="`/blog/${art.slug || art.id}`"
                class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group"
              >
                <div>
                  <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    {{ art.categoryName || art.category || 'Tech' }}
                  </span>
                  <h4 class="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-1 leading-snug">
                    {{ art.title }}
                  </h4>
                </div>
                <span class="text-xs font-mono font-bold text-sky-400 group-hover:underline mt-4">
                  Leggi articolo ➔
                </span>
              </NuxtLink>
            </div>

            <div class="mt-4">
              <DkpNodesHomeWidget />
            </div>
          </div>

          <DkpAdStrip categoryTag="DKP NEWS DETAIL SPONSORED" />

        </div>
      </template>

      <!-- STATE: NOT FOUND -->
      <template v-else>
        <div class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
          <p class="text-3xl">📭</p>
          <p>Scheda notizia non trovata o rimossa.</p>
          <NuxtLink to="/news" class="text-emerald-400 hover:text-emerald-300 underline font-bold mt-2 bg-emerald-500/10 px-4 py-2 rounded-xl transition-colors">
            Torna al DKP Tech Feed
          </NuxtLink>
        </div>
      </template>

    </div>
  </div>
</template>