<script setup lang="ts">
// Definiamo l'interfaccia per il tipo di dato accettato come Prop
interface Comment {
  id: number
  postId: number
  parentId: number | null
  content: string
  createdAt: string | Date
  replies: Comment[]
}

defineProps<{
  node: Comment
}>()
</script>

<template>
  <div class="pl-4 border-l-2 border-gray-200 mt-2">
    <!-- Intestazione del commento -->
    <div class="text-xs text-gray-500 flex items-center gap-2 mb-1">
      <span class="font-semibold text-gray-700">utente_anonimo</span>
      <span>•</span>
      <span>{{ new Date(node.createdAt).toLocaleString() }}</span>
    </div>
    
    <!-- Contenuto del commento -->
    <div class="text-sm text-gray-800 bg-white p-2 rounded shadow-xs border border-gray-100">
      {{ node.content }}
    </div>

    <!-- Bottone di interazione rapida (Mock per ora) -->
    <div class="text-xs text-gray-400 mt-1 flex gap-2">
      <button class="hover:underline cursor-not-allowed">rispondi</button>
    </div>

    <!-- Sub-commenti (Ricorsione autonoma) -->
    <div v-if="node.replies && node.replies.length > 0" class="mt-2 space-y-2">
      <!-- Il componente invoca se stesso per ogni figlio nell'array replies -->
      <CommentNode v-for="reply in node.replies" :key="reply.id" :node="reply" />
    </div>
  </div>
</template>