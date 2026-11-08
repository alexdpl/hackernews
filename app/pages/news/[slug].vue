<!-- app/pages/news/[slug].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

const route = useRoute()
const slugParam = computed(() => route.params.slug as string)

// 1. Fetch dettaglio notizia (chiave esplicita per evitare conflitti di cache)
const { data: newsRes, pending, error } = await useFetch(() => `/api/news/${slugParam.value}`, {
  key: `news-detail-${slugParam.value}`
})

const story = computed(() => {
  if (!newsRes.value) return null
  return (newsRes.value as any).data || newsRes.value
})

// 2. Gestione Commenti Notizia (lazy per non bloccare il caricamento principale della pagina)
const newCommentText = ref('')
const isSubmitting = ref(false)

const { data: commentsRes, refresh: refreshComments } = await useFetch('/api/news/comments', {
  key: `news-comments-${slugParam.value}`,
  query: computed(() => ({ slug: slugParam.value })),
  lazy: true // Fondamentale in Nuxt 4: non blocca l'SSR per i commenti secondari
})

const comments = computed(() => {
  const res: any = commentsRes.value
  if (!res) return []
  return res.data || res.comments || []
})

const copySuccess = ref(false)
function shareStory(title: string, url?: string) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  if (navigator.clipboard) {
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
      refreshComments()
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

const featuredArticles = ref<any[]>([])
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero Vault:', err)
  }
})

useHead({
  title: computed(() => story.value ? `${story.value.title} - DKP Trinity AI News` : 'Scheda Notizia AI - DevKernelPulse')
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- NAV RITORNO -->
      <NuxtLink to="/news" class="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1.5 w-fit">
        ← Torna al DKP HN AI News
      </NuxtLink>

      <!-- STATE: LOADING PRINCIPALE -->
      <div v-if="pending" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Analisi della notizia da parte di Trinity AI in corso...
      </div>

      <!-- STATE: SCHEDA NOTIZIA (Gestita nativamente senza ClientOnly bloccanti) -->
      <template v-else-if="story">
        <div class="flex flex-col gap-8">
          
          <!-- CARD PRINCIPALE NOTIZIA -->
          <article class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="flex items-center justify-between gap-4 flex-wrap relative z-10">
              <div class="flex items-center gap-2">
                <span :class="['px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border', getTypeBadgeColor(story.type)]">
                  {{ story.type === 'show' ? 'SHOW HN' : story.type === 'ask' ? 'ASK HN' : 'NEWS' }}
                </span>
                <span class="text-xs font-mono font-bold text-emerald-400 bg-[#020420] px-3 py-1 rounded-md border border-emerald-500/20 shadow-inner">
                  🔥 {{ story.points || 0 }} pts
                </span>
              </div>

              <span class="text-xs font-mono text-slate-400">
                by @{{ story.author || 'hackernews' }}
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug relative z-10">
              {{ story.title }}
            </h1>

            <!-- ANALISI TRINITY AI -->
            <div class="bg-[#020420] border border-emerald-500/30 rounded-xl p-5 relative z-10 flex flex-col gap-3 shadow-inner">
              <div class="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Sintesi &amp; Analisi Trinity AI:
              </div>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {{ story.summary_it || story.summary || 'Notizia di tendenza analizzata dal motore Trinity AI, focalizzata sull\'impatto tecnologico e architetturale.' }}
              </p>
            </div>

            <!-- METADATI E LINK ORIGINALE & SHARE -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-800/80 relative z-10">
              <div class="flex flex-wrap gap-1.5">
                <span v-for="tag in parseTags(story.tags)" :key="tag" class="text-xs font-mono bg-[#020420] text-sky-400 border border-slate-800 px-2.5 py-1 rounded-lg">
                  #{{ tag }}
                </span>
              </div>

              <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button 
                  @click="shareStory(story.title, story.url)"
                  class="px-4 py-2.5 bg-[#020420] text-slate-300 border border-slate-700 hover:border-emerald-500/50 font-mono text-xs rounded-xl hover:text-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Copia link per condivisione"
                >
                  <span>🔗 {{ copySuccess ? 'Copiato!' : 'Condividi' }}</span>
                </button>

                <a 
                  v-if="story.url" 
                  :href="story.url" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold text-xs rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center gap-1.5"
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
              <span class="text-emerald-400 font-normal text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+10 XP</span>
            </label>
            <textarea 
              v-model="newCommentText" 
              rows="3" 
              placeholder="Esprimi la tua opinione o aggiungi contesto tecnico a questa notizia..." 
              class="w-full bg-[#020420] border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:border-emerald-400 outline-none transition-all"
            ></textarea>
            <div class="flex justify-end">
              <button 
                @click="submitComment" 
                :disabled="isSubmitting || !newCommentText.trim()"
                class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
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

            <div v-if="comments.length === 0" class="p-8 text-center font-mono text-xs text-slate-500 bg-[#090d16] rounded-xl border border-slate-800/80 italic">
              Nessun commento ancora. Condividi per primo la tua opinione!
            </div>

            <div v-else class="flex flex-col gap-3">
              <div 
                v-for="c in comments" 
                :key="c.id" 
                class="bg-[#090d16] border border-slate-800 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs hover:border-emerald-500/30 transition-colors"
              >
                <div class="flex items-center justify-between text-slate-400 text-[11px]">
                  <span class="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">@{{ c.authorUsername || c.author || 'dev_kernel' }}</span>
                  <span>{{ new Date(c.createdAt || Date.now()).toLocaleDateString('it-IT') }}</span>
                </div>
                <p class="text-slate-200 text-xs font-sans leading-relaxed mt-1">
                  {{ c.content }}
                </p>
              </div>
            </div>
          </section>

          <!-- APPROFONDIMENTI DAL VAULT & WIDGET -->
          <div v-if="featuredArticles.length > 0" class="pt-8 border-t border-slate-800 flex flex-col gap-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
              <span>🔗</span> Approfondimenti dal Vault
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NuxtLink 
                v-for="art in featuredArticles" 
                :key="art.id" 
                :to="`/blog/${art.slug || art.id}`"
                class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group"
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

            <DkpNodesHomeWidget />
          </div>

          <DkpAdStrip categoryTag="DKP NEWS DETAIL SPONSORED" />

        </div>
      </template>

      <!-- STATE: NOT FOUND -->
      <template v-else>
        <div class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
          <p class="text-3xl">📭</p>
          <p>Scheda notizia non trovata o rimossa.</p>
          <NuxtLink to="/news" class="text-emerald-400 hover:text-emerald-300 underline font-bold mt-2 bg-emerald-500/10 px-4 py-2 rounded-lg transition-colors">Torna a DKP HN AI News</NuxtLink>
        </div>
      </template>

    </div>
  </div>
</template>