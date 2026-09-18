<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const postId = route.params.id

// Recupera i dati dall'API appena creata
const { data, error, pending } = await useFetch(`/api/item/${postId}`)
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 font-sans bg-[#f6f6ef] text-[#1a1a1a]">
    <!-- Stato di caricamento ed errori -->
    <div v-if="pending" class="text-gray-500 py-4">Caricamento in corso...</div>
    <div v-else-if="error || !data" class="text-red-500 py-4">
      Errore durante il caricamento dell'item o post non trovato.
    </div>

    <div v-else>
      <!-- Sezione Post (Header nello stile HN) -->
      <div class="mb-6">
        <div class="flex items-baseline gap-2">
          <h1 class="text-lg font-bold text-gray-900">
            <a v-if="data.post.url" :href="data.post.url" target="_blank" class="hover:underline">
              {{ data.post.title }}
            </a>
            <span v-else>{{ data.post.title }}</span>
          </h1>
          <span v-if="data.post.url" class="text-xs text-gray-500">
            ({{ new URL(data.post.url).hostname }})
          </span>
        </div>
        
        <p class="text-xs text-gray-500 mt-1">
          {{ data.post.score }} punti da {{ data.post.by }} | 
          {{ new Date(data.post.createdAt).toLocaleString() }} | 
          {{ data.post.descendants }} commenti
        </p>
      </div>

      <!-- Area Inserimento Nuovo Commento Principale (Mock o Futura implementazione) -->
      <div class="mb-8 bg-white p-4 rounded shadow-sm border border-gray-200">
        <h3 class="text-sm font-bold mb-2">Aggiungi un commento</h3>
        <textarea 
          placeholder="Scrivi qualcosa... (funzionalità di scrittura nel prossimo step)" 
          rows="3" 
          class="w-full p-2 border rounded text-sm bg-gray-50 cursor-not-allowed"
          disabled
        ></textarea>
        <button class="mt-2 px-3 py-1 bg-[#ff6600] text-white text-xs font-bold rounded opacity-50 cursor-not-allowed">
          add comment
        </button>
      </div>

      <!-- Lista dei Commenti (Albero Ricorsivo) -->
      <div>
        <h2 class="text-md font-bold border-b border-gray-300 pb-2 mb-4">Discussione</h2>
        <p v-if="data.comments.length === 0" class="text-sm text-gray-500 italic">
          Nessun commento presente. Sii il primo a commentare!
        </p>
        
        <ul v-else class="space-y-4">
          <!-- Iterazione sui nodi radice dell'albero dei commenti -->
          <li v-for="comment in data.comments" :key="comment.id">
            <CommentNode :node="comment" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>