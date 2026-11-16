<!-- app/pages/item/[id].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/DkpAdsWidget.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import DkpRelatedPosts from '~/components/blog/DkpRelatedPosts.vue'

interface Comment {
  id: number
  author?: string | any
  text: string
  createdAt?: string | Date
  created_at?: string | Date
}

interface Item {
  id: number
  title: string
  url?: string | null
  domain?: string | null
  points?: number
  author?: string | any
  createdAt?: string | Date
  created_at?: string | Date
  description?: string | null
  text?: string | null
  content?: string | null
  category?: string
  categoryName?: string
  tags?: string[]
  comments?: Comment[]
}

const route = useRoute()
const router = useRouter()
const itemId = Number(route.params.id) || 1

function safeExtractDomain(rawUrl?: string | null, fallbackDomain?: string | null): string {
  if (fallbackDomain) return fallbackDomain
  if (!rawUrl || rawUrl.startsWith('/')) return 'devkernelpulse.org'
  try {
    const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    return new URL(normalized).hostname.replace(/^www\./, '')
  } catch {
    return 'devkernelpulse.org'
  }
}

// 1. Fetch Dettaglio Post dal DB / API unificata
const { data: itemResponse, pending, error } = await useFetch<any>(`/api/news/${itemId}`)

const item = computed<Item | null>(() => {
  if (!itemResponse.value) return null
  const raw = itemResponse.value.data || itemResponse.value.post || itemResponse.value.story || itemResponse.value
  if (!raw || !raw.title) return null

  return {
    ...raw,
    author: typeof raw.author === 'object' ? raw.author?.username : (raw.author || raw.user || 'community'),
    domain: safeExtractDomain(raw.url, raw.domain),
    tags: Array.isArray(raw.tags) ? raw.tags : []
  }
})

// 2. Fetch Commenti (con fallback sicuro a lista vuota)
const { data: commentsData, refresh: refreshComments } = await useFetch<any>('/api/comments', {
  query: { postId: itemId },
  lazy: true
})

const comments = computed<Comment[]>(() => {
  const list = commentsData.value?.comments || commentsData.value?.data || item.value?.comments || []
  if (!Array.isArray(list)) return []
  return list.map((c: any) => ({
    ...c,
    author: typeof c.author === 'object' ? c.author?.username : (c.author || c.user || 'Anonimo')
  }))
})

// 3. Stato Auth Utente
const { data: authData } = await useFetch<any>('/api/auth/me', {
  lazy: true,
  default: () => null
})
const currentUser = computed(() => authData.value?.username || null)
const isAdmin = computed(() => currentUser.value === 'alexdpl' || authData.value?.role === 'admin')

// Form Inserimento Commento
const commentText = ref('')
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

async function handleCommentSubmit() {
  if (!commentText.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const res: any = await $fetch('/api/comments', {
      method: 'POST',
      body: {
        postId: itemId,
        text: commentText.value.trim()
      }
    })

    if (res?.success) {
      submitSuccess.value = 'Commento inviato con successo! (+5 XP)'
      commentText.value = ''
      await refreshComments()
    } else {
      submitError.value = res?.error || 'Impossibile pubblicare il commento.'
    }
  } catch (err: any) {
    console.error('Errore invio commento:', err)
    submitError.value = err?.data?.statusMessage || 'Errore di connessione o server non disponibile.'
  } finally {
    isSubmitting.value = false
  }
}

// Moderazione Admin
async function deletePost() {
  if (!confirm('Sei sicuro di voler eliminare questo post e tutti i suoi commenti?')) return
  try {
    const res: any = await $fetch('/api/admin/delete-item', {
      method: 'POST',
      body: { id: itemId, type: 'post' }
    })
    if (res?.success) {
      router.push('/')
    } else {
      alert(res?.error || 'Errore durante eliminazione')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione')
  }
}

async function deleteComment(commentId: number) {
  if (!confirm('Vuoi eliminare questo commento?')) return
  try {
    const res: any = await $fetch('/api/admin/delete-item', {
      method: 'POST',
      body: { id: commentId, type: 'comment' }
    })
    if (res?.success) {
      await refreshComments()
    } else {
      alert(res?.error || 'Errore eliminazione commento')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione')
  }
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return 'di recente'
  try {
    return new Date(dateStr).toLocaleDateString('it-IT')
  } catch {
    return 'di recente'
  }
}

useHead({
  title: computed(() => (item.value ? `${item.value.title} — DevKernelPulse` : 'Discussione — DevKernelPulse'))
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-200 py-6 sm:py-10 px-4 font-sans">
    <div class="max-w-4xl mx-auto flex flex-col gap-6">
      <!-- BREADCRUMB NAVIGAZIONE -->
      <nav class="flex items-center justify-between font-mono text-xs text-slate-400">
        <NuxtLink
          to="/feed"
          class="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors no-underline"
        >
          ← Torna al Feed HN
        </NuxtLink>
        <span class="text-slate-600">ITEM #{{ itemId }}</span>
      </nav>

      <!-- STATE: CARICAMENTO -->
      <div
        v-if="pending"
        class="bg-[#090d16]/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 font-mono text-xs sm:text-sm shadow-xl"
      >
        <span class="inline-block animate-pulse mr-2">⚡</span> Caricamento articolo e discussione dal Kernel DB...
      </div>

      <!-- STATE: ERRORE / NON TROVATO -->
      <div
        v-else-if="error || !item"
        class="bg-[#090d16]/90 border border-slate-800 rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center gap-4 shadow-xl"
      >
        <h2 class="text-lg sm:text-xl font-black text-white m-0">
          📭 Elemento non trovato o errore di sincronizzazione.
        </h2>
        <p class="text-slate-400 text-xs sm:text-sm max-w-md m-0">
          La notizia potrebbe essere stata rimossa o non è ancora presente nel database Neon.
        </p>
        <NuxtLink
          to="/"
          class="mt-2 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs px-5 py-2.5 rounded-xl transition-all no-underline"
        >
          ← Torna alla Home Feed
        </NuxtLink>
      </div>

      <!-- CONTENT: DETTAGLIO POST & DISCUSSIONI -->
      <template v-else>
        <!-- 1. Header Post & Moderazione Admin -->
        <section class="bg-[#090d16]/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
            <h1 class="text-xl sm:text-2xl font-black text-white leading-snug m-0">
              <a
                v-if="item.url"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-white hover:text-emerald-400 transition-colors no-underline hover:underline"
              >
                {{ item.title }} ↗
              </a>
              <span v-else>{{ item.title }}</span>
              <span v-if="item.domain" class="text-xs sm:text-sm font-mono font-semibold text-sky-400 ml-2">
                ({{ item.domain }})
              </span>
            </h1>

            <button
              v-if="isAdmin"
              @click="deletePost"
              class="shrink-0 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer"
              title="Elimina post"
            >
              🗑️ Elimina Post
            </button>
          </div>

          <div class="flex items-center flex-wrap gap-2 text-xs text-slate-400 font-mono">
            <span class="text-amber-400 font-extrabold">▲ {{ item.points || 1 }} punti</span>
            <span class="text-slate-700">•</span>
            <span>
              Pubblicato il <strong class="text-slate-200">{{ formatDate(item.createdAt || item.created_at) }}</strong>
            </span>
            <span class="text-slate-700">•</span>
            <span>
              Autore: <strong class="text-purple-400">@{{ item.author }}</strong>
            </span>
            <span class="text-slate-700">•</span>
            <span class="text-slate-500">
              Verified da <strong class="text-emerald-400/90">DKP Crawler</strong>
            </span>
          </div>

          <div
            v-if="item.description || item.text || item.content"
            class="mt-1 p-4 sm:p-5 bg-[#050811] border-l-4 border-emerald-400 rounded-r-xl text-sm text-slate-300 leading-relaxed whitespace-pre-line"
          >
            {{ item.description || item.text || item.content }}
          </div>
        </section>

        <!-- 2. Form Inserimento Commento -->
        <section class="bg-[#090d16]/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h3 class="text-base sm:text-lg font-extrabold text-white m-0 flex items-center gap-2">
            <span>💬</span> Partecipa alla Discussione
          </h3>

          <div
            v-if="submitSuccess"
            class="p-3.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          >
            ✅ {{ submitSuccess }}
          </div>
          <div
            v-if="submitError"
            class="p-3.5 rounded-xl text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30"
          >
            ⚠️ {{ submitError }}
          </div>

          <div v-if="currentUser" class="flex flex-col gap-3">
            <p class="text-xs font-mono text-slate-400 m-0">
              Stai commentando come <strong class="text-emerald-400">@{{ currentUser }}</strong>:
            </p>
            <textarea
              v-model="commentText"
              rows="3"
              required
              placeholder="Scrivi qui il tuo contributo o la tua analisi tecnica..."
              class="w-full p-3.5 bg-[#050811] border border-slate-800 rounded-xl text-slate-100 text-sm outline-none focus:border-emerald-400 transition-colors resize-y"
            ></textarea>
            <div class="flex justify-end">
              <button
                type="button"
                @click="handleCommentSubmit"
                :disabled="isSubmitting || !commentText.trim()"
                class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-mono font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,220,130,0.25)] cursor-pointer border-none"
              >
                {{ isSubmitting ? 'Invio in corso...' : 'Invia Commento (+5 XP)' }}
              </button>
            </div>
          </div>

          <div
            v-else
            class="bg-[#050811] border border-dashed border-slate-700 p-5 rounded-xl text-center text-slate-400 text-xs sm:text-sm"
          >
            🔒 Per commentare o votare devi effettuare il
            <NuxtLink to="/login" class="text-emerald-400 font-bold underline hover:text-emerald-300">
              Login
            </NuxtLink>
            nel DKP Hub.
          </div>
        </section>

        <!-- 3. Lista dei Commenti -->
        <section class="bg-[#090d16]/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h3 class="text-base sm:text-lg font-extrabold text-white m-0">
            Commenti ({{ comments.length }})
          </h3>

          <div
            v-if="comments.length === 0"
            class="text-center py-10 px-4 bg-[#050811] border border-dashed border-slate-800 rounded-xl text-slate-400 flex flex-col items-center gap-1.5"
          >
            <span class="text-2xl">💬</span>
            <p class="font-bold text-slate-200 text-sm m-0">Nessun commento ancora presente.</p>
            <span class="text-xs text-slate-500">Sii il primo sviluppatore a lasciare un parere su questa notizia!</span>
          </div>

          <div v-else class="flex flex-col gap-3">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="p-4 sm:p-5 bg-[#050811] border border-slate-800/90 hover:border-slate-700 rounded-xl transition-colors flex flex-col gap-2"
            >
              <div class="flex justify-between items-center gap-2 font-mono text-xs">
                <div class="flex items-center gap-2">
                  <strong class="text-emerald-400">@{{ comment.author }}</strong>
                  <span class="text-slate-700">•</span>
                  <span class="text-slate-500">{{ formatDate(comment.createdAt || comment.created_at) }}</span>
                </div>

                <button
                  v-if="isAdmin"
                  @click="deleteComment(comment.id)"
                  class="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                  title="Elimina commento"
                >
                  🗑️ Rimuovi
                </button>
              </div>

              <div class="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {{ comment.text }}
              </div>
            </article>
          </div>
        </section>

        <!-- 4. CIRCUITO TOOLS DKP, API & SPONSOR SELF-SERVE -->
        <section class="pt-2">
          <DkpAdsWidget placement="feedInline" :compact="true" />
        </section>

        <!-- 5. APPROFONDIMENTI DAL VAULT -->
        <section class="pt-6 border-t border-slate-800">
          <DkpRelatedPosts
            v-if="item && item.id"
            current-post-id=""
            :category="item.categoryName || item.category || 'Generale'"
            :tags="item.tags || []"
          />
        </section>

        <!-- 6. DISCUSSIONI CORRELATE NEI NODI -->
        <section class="pt-6 border-t border-slate-800">
          <DKPRelatedThreads />
        </section>

        <!-- 7. DKP DEV LIBRARY (LIBRI AFFILIATI AMAZON CONTESTUALI) -->
        <section class="pt-2">
          <DkpAdStrip
            :topic="item.title"
            categoryTag="DKP DEV LIBRARY • LIBRI CONSIGLIATI"
          />
        </section>
      </template>
    </div>
  </div>
</template>
<style scoped>
.dkp-hmr-anchor { display: block; }
</style>