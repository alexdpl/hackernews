<script setup lang="ts">
import { ref, provide } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const postId = route.params.id

const newCommentContent = ref('')
const isSubmitting = ref(false)

// Caricamento dati da server/api/hn/comment.ts
const { data, error, pending, refresh } = await useFetch('/api/hn/comment', {
  query: { postId }
})

// Gestione dell'invio dell'upvote al database Neon
const handleUpvote = async () => {
  try {
    await $fetch('/api/hn/vote', {
      method: 'POST',
      body: { postId: postId }
    })
    await refresh() // Ricarica i dati includendo il nuovo punteggio aggiornato dal DB
  } catch (err: any) {
    alert(err.statusMessage || 'Errore durante l\'upvote o voto già inserito.')
  }
}

// Gestione dell'invio del commento principale
const handleAddComment = async () => {
  if (!newCommentContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await $fetch('/api/hn/comment', {
      method: 'POST',
      body: {
        postId: postId,
        parentId: null,
        content: newCommentContent.value
      }
    })
    newCommentContent.value = ''
    await refresh()
  } catch (err) {
    alert('Errore durante l\'invio del commento.')
  } finally {
    isSubmitting.value = false
  }
}

// Condividiamo la funzione di refresh con l'albero dei sotto-commenti
provide('refreshComments', refresh)
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
        <div v-else-if="error || !data" class="text-red-600 py-2">Post non trovato o errore server.</div>

        <div v-else>
          <!-- Intestazione del Post -->
          <div class="mb-4">
            <div class="flex items-start gap-1">
              <!-- Freccetta Upvote HN Dinamica e Funzionante -->
              <div 
                @click="handleUpvote" 
                class="text-[#828282] text-[10px] pt-1 cursor-pointer select-none hover:text-[#ff6600] transition-colors"
              >
                ▲
              </div>
              <div>
                <span class="text-[14px] text-black">
                  <a v-if="data.post.url" :href="data.post.url" target="_blank" class="hover:underline">{{ data.post.title }}</a>
                  <span v-else>{{ data.post.title }}</span>
                </span>
                <span v-if="data.post.url" class="text-[10px] text-[#828282] ml-1">
                  ({{ new URL(data.post.url).hostname }})
                </span>
              </div>
            </div>
            <!-- Sotto-titolo info -->
            <div class="text-[10px] text-[#828282] pl-4 mt-0.5">
              {{ data.post.score }} points by {{ data.post.by }} | 
              {{ new Date(data.post.createdAt).toLocaleString() }} | 
              {{ data.post.descendants }} comments
            </div>
          </div>

          <!-- Textarea per il commento principale -->
          <div class="pl-4 mb-6">
            <textarea 
              v-model="newCommentContent"
              rows="4" 
              class="w-full max-w-[600px] p-1 border border-gray-400 font-mono text-[13px] bg-white focus:outline-none"
              :disabled="isSubmitting"
            ></textarea>
            <div class="mt-2">
              <button 
                @click="handleAddComment"
                :disabled="isSubmitting"
                class="px-2 py-0.5 border border-gray-500 bg-[#e0e0e0] active:bg-gray-300 text-[12px] rounded-xs text-black"
              >
                {{ isSubmitting ? 'submitting...' : 'add comment' }}
              </button>
            </div>
          </div>

          <!-- Contenitore dell'Albero delle Discussioni -->
          <div class="pl-1 border-t border-[#dedede] pt-4">
            <ul class="space-y-5 list-none p-0 m-0">
              <li v-for="comment in data.comments" :key="comment.id">
                <CommentNode :node="comment" />
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>