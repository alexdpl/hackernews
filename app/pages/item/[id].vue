<!-- app/pages/item/[id].vue -->
<script setup lang="ts">
import { ref, computed, provide, onUnmounted } from 'vue'

interface CommentItem {
  id: number
  postId: number
  parentId: number | null
  author: string
  content: string
  createdAt: string
  children?: CommentItem[]
}

interface Post {
  id: number
  title: string
  url: string | null
  points: number
  createdAt: string
  hasVoted?: boolean
}

const route = useRoute()

// 1. Estrazione e validazione reattiva dell'ID post (previene chiamate con NaN/undefined)
const postId = computed(() => {
  const id = Number(route.params.id)
  return !isNaN(id) && id > 0 ? id : null
})

// 2. Fetch reattivo dei commenti dall'endpoint corretto
const { data: commentsRes, error, pending, refresh } = await useFetch(
  () => (postId.value ? `/api/posts/${postId.value}/comments` : null),
  {
    immediate: !!postId.value
  }
)

const rawComments = computed<CommentItem[]>(() => commentsRes.value?.data || [])

// 3. Recupero dei dettagli del post principale
const post = ref<Post | null>(null)

if (postId.value) {
  try {
    const res = await $fetch<any>('/api/posts', { query: { id: postId.value } })
    if (res?.success && Array.isArray(res.data)) {
      const found = res.data.find((p: any) => p.id === postId.value) || res.data[0]
      if (found) {
        post.value = {
          ...found,
          points: found.points ?? 1,
          hasVoted: false
        }
      }
    }
  } catch (err) {
    console.error('Impossibile recuperare i dettagli del post:', err)
  }
}

// 4. Gestione dell'Upvote Atomico sul DB Neon
const isVoting = ref(false)
const handleUpvote = async () => {
  if (!post.value || post.value.hasVoted || isVoting.value) return
  isVoting.value = true

  try {
    const res = await $fetch<any>(`/api/posts/${post.value.id}/vote`, {
      method: 'POST'
    })
    if (res?.success) {
      post.value.points = res.points
      post.value.hasVoted = true
    }
  } catch (err: any) {
    if (err.statusCode === 409) {
      post.value.hasVoted = true
      alert('Hai già votato questo post.')
    } else {
      alert(err.data?.statusMessage || 'Errore durante la registrazione del voto.')
    }
  } finally {
    isVoting.value = false
  }
}

// 5. Gestione dell'invio del commento principale
const newCommentContent = ref('')
const authorName = ref('')
const isSubmitting = ref(false)

const handleAddComment = async () => {
  if (!postId.value || !newCommentContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await $fetch(`/api/posts/${postId.value}/comments`, {
      method: 'POST',
      body: {
        author: authorName.value.trim() || 'utente_anonimo',
        content: newCommentContent.value.trim(),
        parentId: null
      }
    })
    newCommentContent.value = ''
    await refresh() // Ricarica la lista dei commenti dal DB Neon
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Errore durante l\'invio del commento.')
  } finally {
    isSubmitting.value = false
  }
}

// Helper sicuro per l'estrazione del dominio
function getDomain(urlString: string | null): string {
  if (!urlString) return ''
  try {
    const url = new URL(urlString)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Condivisione funzione refresh per eventuali sotto-componenti
provide('refreshComments', refresh)

// Hard Cleanup
onUnmounted(() => {
  post.value = null
  newCommentContent.value = ''
  authorName.value = ''
})
</script>

<template>
  <div class="min-h-screen bg-[#f6f6ef] md:py-2 md:px-4 font-mono text-[13px] text-[#222222]">
    <div class="max-w-[85%] mx-auto bg-[#f6f6ef]">
      
      <!-- Hacker News Header Bar -->
      <header class="bg-[#ff6600] p-1 flex items-center justify-between text-black font-sans">
        <div class="flex items-center gap-2 font-bold">
          <NuxtLink to="/" class="border-2 border-white px-1.5 py-0.5 text-white font-extrabold text-[14px] leading-none select-none">
            Y
          </NuxtLink>
          <NuxtLink to="/" class="hover:underline text-[14px]">Hacker News</NuxtLink>
          <span class="font-normal text-[#1a1a1a] text-[13px] flex gap-2 ml-2">
            <NuxtLink to="/" class="hover:underline">new</NuxtLink> |
            <NuxtLink to="/submit" class="hover:underline">submit</NuxtLink>
          </span>
        </div>
      </header>

      <!-- Corpo principale della pagina -->
      <main class="p-3 font-sans">
        <div v-if="pending" class="text-[#828282] py-2">Loading...</div>
        <div v-else-if="error || (!post && !pending)" class="text-red-600 py-2">Post non trovato o errore server.</div>

        <div v-else-if="post">
          <!-- Intestazione del Post -->
          <div class="mb-4">
            <div class="flex items-start gap-1">
              <!-- Freccetta Upvote HN -->
              <div 
                @click="handleUpvote" 
                class="text-[10px] pt-1 cursor-pointer select-none transition-colors"
                :class="post.hasVoted ? 'text-gray-300 cursor-default' : 'text-[#828282] hover:text-[#ff6600]'"
                title="Upvote"
              >
                ▲
              </div>
              <div>
                <span class="text-[14px] text-black font-medium">
                  <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="hover:underline">
                    {{ post.title }}
                  </a>
                  <span v-else>{{ post.title }}</span>
                </span>
                <span v-if="getDomain(post.url)" class="text-[10px] text-[#828282] ml-1">
                  ({{ getDomain(post.url) }})
                </span>
              </div>
            </div>

            <!-- Subtext Info -->
            <div class="text-[10px] text-[#828282] pl-4 mt-0.5">
              {{ post.points }} punti | 
              pubblicato il {{ post.createdAt ? new Date(post.createdAt).toLocaleString('it-IT') : 'di recente' }} | 
              {{ rawComments.length }} commenti
            </div>
          </div>

          <!-- Modulo Invio Commento -->
          <div class="pl-4 mb-6">
            <div class="mb-2">
              <input 
                v-model="authorName" 
                type="text" 
                placeholder="Nome utente (opzionale)" 
                class="max-w-[250px] p-1 border border-gray-400 font-sans text-[12px] bg-white focus:outline-none mb-2 block"
                maxlength="50"
              />
              <textarea 
                v-model="newCommentContent"
                rows="4" 
                placeholder="Aggiungi un commento..."
                class="w-full max-w-[600px] p-1 border border-gray-400 font-sans text-[13px] bg-white focus:outline-none block"
                :disabled="isSubmitting"
              ></textarea>
            </div>
            <div>
              <button 
                @click="handleAddComment"
                :disabled="isSubmitting || !newCommentContent.trim()"
                class="px-2 py-0.5 border border-gray-500 bg-[#e0e0e0] active:bg-gray-300 text-[12px] rounded-xs text-black cursor-pointer disabled:opacity-50"
              >
                {{ isSubmitting ? 'submitting...' : 'add comment' }}
              </button>
            </div>
          </div>

          <!-- Sezione Lista Commenti -->
          <div class="pl-1 border-t border-[#dedede] pt-4">
            <div v-if="rawComments.length > 0" class="space-y-4">
              <div v-for="comment in rawComments" :key="comment.id" class="bg-[#f0f0e8] p-2 rounded-xs">
                <div class="text-[10px] text-[#828282] mb-1">
                  <span class="font-bold text-black">{{ comment.author || 'utente_anonimo' }}</span> 
                  <span> | {{ comment.createdAt ? new Date(comment.createdAt).toLocaleString('it-IT') : '' }}</span>
                </div>
                <div class="text-[12px] text-black whitespace-pre-line">
                  {{ comment.content }}
                </div>
              </div>
            </div>

            <div v-else class="text-[12px] text-[#828282]">
              Non ci sono ancora commenti. Sii il primo a commentare!
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>