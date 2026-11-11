<!-- app/pages/nodes/thread/[id].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DKPAdBanner from '~/components/DKPAdBanner.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import SocialShareTalks from '~/components/nodes/SocialShareTalks.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const postId = Number(route.params.id)

const newCommentText = ref('')
const activeReplyParentId = ref<number | null>(null)
const replyText = ref('')
const isSubmitting = ref(false)

const { currentUser } = useAuthCore()

const currentUrl = computed(() => {
  return typeof window !== 'undefined' ? window.location.href : `https://devkernelpulse.org/nodes/thread/${postId}`
})

// Caricamento Dettagli Thread
const { data: postsRes, refresh: refreshThread } = await useFetch('/api/nodes/posts')
const thread = computed(() => {
  const allPosts = postsRes.value?.posts || []
  return allPosts.find((p: any) => p.id === postId) || null
})

// Caricamento Commenti
const { data: commentsRes, pending: loadingComments, refresh: refreshComments } = await useFetch('/api/nodes/comments', {
  query: { postId }
})

const rawComments = computed(() => commentsRes.value?.comments || [])

// 🟢 Recupero 4 articoli in evidenza dal Vault (Grid 4 schede)
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

interface CommentNode {
  id: number
  postId: number
  authorId: number
  parentId: number | null
  content: string
  karmaScore: number
  createdAt: string
  authorUsername: string
  authorAvatar?: string
  replies?: CommentNode[]
}

const structuredComments = computed<CommentNode[]>(() => {
  const map = new Map<number, CommentNode>()
  const roots: CommentNode[] = []

  rawComments.value.forEach((c: any) => {
    map.set(c.id, { ...c, replies: [] })
  })

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.replies!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
})

async function submitComment(parentId: number | null = null) {
  const content = parentId ? replyText.value.trim() : newCommentText.value.trim()
  if (!content) return

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/nodes/comments', {
      method: 'POST',
      body: {
        postId,
        parentId,
        content,
        userId: currentUser.value?.id
      }
    })

    if (res && res.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
      }
      if (parentId) {
        replyText.value = ''
        activeReplyParentId.value = null
      } else {
        newCommentText.value = ''
      }
      refreshComments()
      refreshThread()
    }
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Errore invio commento.')
  } finally {
    isSubmitting.value = false
  }
}

async function vote(postIdTarget: number | null, commentIdTarget: number | null, voteValue: number) {
  try {
    const res: any = await $fetch('/api/nodes/vote', {
      method: 'POST',
      body: {
        postId: postIdTarget,
        commentId: commentIdTarget,
        voteValue,
        userId: currentUser.value?.id
      }
    })
    if (res && res.success) {
      if (postIdTarget) refreshThread()
      if (commentIdTarget) refreshComments()
    }
  } catch (err) {
    console.warn('Errore durante il voto:', err)
  }
}

useHead({
  title: computed(() => thread.value ? `${thread.value.title} — DKP Talks v2.6-PURE-SQL` : 'Discussione DKP Nodes v2.6')
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans p-4 md:p-8 relative">
    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- NAV RITORNO E ACCESSO RAPIDO HOME ECOSYSTEM -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <NuxtLink to="/nodes" class="text-xs font-mono font-bold text-purple-400 hover:underline flex items-center gap-1.5">
          ← Torna a DKP Nodes Hub
        </NuxtLink>

        <div class="flex items-center gap-2 font-mono text-xs">
          <NuxtLink to="/news" class="text-emerald-400 hover:underline font-bold">🌍 Feed</NuxtLink>
          <span class="text-slate-600">•</span>
          <NuxtLink to="/tools" class="text-slate-300 hover:underline">🛠️ Tools</NuxtLink>
        </div>
      </div>

      <!-- GRID A 2 COLONNE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <!-- COLONNA PRINCIPALE -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- THREAD MAIN CONTAINER -->
          <article v-if="thread" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-2xl flex gap-5">
            <div class="flex flex-col items-center bg-[#020420] p-2.5 rounded-xl border border-slate-800 font-mono text-xs h-fit">
              <button @click="vote(thread.id, null, 1)" class="text-slate-500 hover:text-emerald-400 font-bold text-base transition-colors">▲</button>
              <span class="font-extrabold my-1.5 text-slate-100">{{ thread.karmaScore }}</span>
              <button @click="vote(thread.id, null, -1)" class="text-slate-500 hover:text-rose-400 font-bold text-base transition-colors">▼</button>
            </div>

            <div class="flex-1 flex flex-col gap-3">
              <div class="flex items-center gap-2 font-mono text-xs text-slate-400 flex-wrap">
                <span class="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {{ thread.nodeIcon || '💬' }} {{ thread.nodeName || 'General' }}
                </span>
                <span>•</span>
                <span class="text-slate-200 font-semibold">@{{ thread.authorUsername }}</span>
                <span>•</span>
                <span>{{ new Date(thread.createdAt).toLocaleDateString('it-IT') }}</span>
              </div>

              <h1 class="text-xl font-extrabold text-white tracking-tight font-sans">{{ thread.title }}</h1>

              <div class="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-[#020420] p-4 rounded-xl border border-slate-800/80 font-mono">
                {{ thread.content }}
              </div>

              <div v-if="thread.vaultHash" class="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl font-mono text-xs text-purple-300 flex items-center justify-between">
                <span>🛡️ Proof-of-Code Vault Certified</span>
                <span class="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">{{ thread.vaultHash }}</span>
              </div>
            </div>
          </article>

          <!-- FORM NUOVO COMMENTO -->
          <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3 font-mono text-xs">
            <label class="font-bold text-slate-300 flex items-center justify-between">
              <span>💬 Partecipa alla discussione:</span>
              <span class="text-emerald-400 font-normal text-[11px]">+10 XP per ogni risposta</span>
            </label>
            <textarea 
              v-model="newCommentText" 
              rows="3" 
              placeholder="Scrivi la tua opinione o condividi del codice..." 
              class="w-full bg-[#020420] border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-purple-400 outline-none font-sans"
            ></textarea>
            <div class="flex justify-end">
              <button 
                @click="submitComment(null)" 
                :disabled="isSubmitting || !newCommentText.trim()"
                class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {{ isSubmitting ? 'Invio in corso...' : 'Invia Commento (+10 XP)' }}
              </button>
            </div>
          </div>

          <!-- ALBERO COMMENTI -->
          <section class="flex flex-col gap-4 mt-2">
            <h3 class="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Commenti ({{ rawComments.length }})
            </h3>

            <div v-if="loadingComments" class="p-8 text-center font-mono text-xs text-emerald-400 bg-[#090d16] rounded-2xl border border-slate-800 animate-pulse">
              Caricamento albero commenti...
            </div>

            <div v-else-if="structuredComments.length === 0" class="p-8 text-center font-mono text-xs text-slate-500 bg-[#090d16] rounded-2xl border border-slate-800 italic">
              Nessun commento ancora. Rispondi per primo!
            </div>

            <div v-else class="flex flex-col gap-3">
              <template v-for="comment in structuredComments" :key="comment.id">
                <div class="bg-[#090d16] border border-slate-800 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs">
                  <div class="flex items-center justify-between text-slate-400 text-[11px]">
                    <span class="font-bold text-slate-200">@{{ comment.authorUsername }}</span>
                    <span>{{ new Date(comment.createdAt).toLocaleDateString('it-IT') }}</span>
                  </div>

                  <p class="text-slate-300 text-xs leading-relaxed font-sans">
                    {{ comment.content }}
                  </p>

                  <div class="flex items-center gap-4 mt-1 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div class="flex items-center gap-2 bg-[#020420] px-2 py-0.5 rounded border border-slate-800">
                      <button @click="vote(null, comment.id, 1)" class="hover:text-emerald-400 font-bold">▲</button>
                      <span class="font-extrabold text-slate-200">{{ comment.karmaScore }}</span>
                      <button @click="vote(null, comment.id, -1)" class="hover:text-rose-400 font-bold">▼</button>
                    </div>

                    <button 
                      @click="activeReplyParentId = activeReplyParentId === comment.id ? null : comment.id"
                      class="text-purple-400 hover:underline font-bold"
                    >
                      Rispondi
                    </button>
                  </div>

                  <div v-if="activeReplyParentId === comment.id" class="mt-2 pl-4 border-l-2 border-purple-400 flex flex-col gap-2">
                    <textarea 
                      v-model="replyText" 
                      rows="2" 
                      placeholder="Scrivi una risposta diretta..." 
                      class="w-full bg-[#020420] border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-purple-400 outline-none font-sans"
                    ></textarea>
                    <div class="flex gap-2 justify-end font-mono">
                      <button @click="activeReplyParentId = null" class="px-3 py-1 bg-slate-900 text-slate-400 rounded-lg text-[11px]">Annulla</button>
                      <button @click="submitComment(comment.id)" class="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[11px]">Invia (+10 XP)</button>
                    </div>
                  </div>

                  <div v-if="comment.replies && comment.replies.length > 0" class="pl-4 border-l-2 border-slate-800 flex flex-col gap-2 mt-2">
                    <div v-for="reply in comment.replies" :key="reply.id" class="bg-[#020420] p-3 rounded-lg border border-slate-800/80">
                      <div class="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                        <span class="font-bold text-slate-300">@{{ reply.authorUsername }}</span>
                        <span>{{ new Date(reply.createdAt).toLocaleDateString('it-IT') }}</span>
                      </div>
                      <p class="text-slate-300 text-xs font-sans">{{ reply.content }}</p>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <!-- DISCUSSIONI CORRELATE -->
          <div class="pt-6 border-t border-slate-800">
            <DKPRelatedThreads 
              v-if="thread" 
              :currentNodeSlug="thread.nodeSlug" 
              :currentPostId="thread.id" 
            />
          </div>

          <!-- APPROFONDIMENTI DAL VAULT (4 SCHEDE GRID) -->
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

          <!-- HACKER NEWS AI STREAM -->
          <div class="pt-6 border-t border-slate-800">
            <DkpNodesHomeWidget />
          </div>

          <DkpAdStrip categoryTag="DKP THREAD STREAM" />

        </div>

        <!-- SIDEBAR DESTRA -->
        <aside class="lg:col-span-1 w-full h-full">
          <div class="sticky top-24 flex flex-col gap-6">
            <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center">
              <span class="text-[10px] font-mono text-slate-400 mb-3 uppercase tracking-wider font-bold">Condividi Discussione</span>
              <SocialShareTalks :title="thread?.title || 'Discussione DKP Nodes'" :url="currentUrl" :vertical="true" />
            </div>

            <DKPAdBanner />
          </div>
        </aside>

      </div>
    </div>
  </div>