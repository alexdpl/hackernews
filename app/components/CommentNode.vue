<script setup lang="ts">
import { ref, inject } from 'vue'

interface Comment {
  id: number
  postId: number
  parentId: number | null
  content: string
  createdAt: string | Date
  replies: Comment[]
}

const props = defineProps<{
  node: Comment
}>()

const refreshComments = inject<() => Promise<void>>('refreshComments')

const showReplyForm = ref(false)
const replyContent = ref('')
const isSubmitting = ref(false)

const handleReply = async () => {
  if (!replyContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await $fetch('/api/hn/comment', {
      method: 'POST',
      body: {
        postId: props.node.postId,
        parentId: props.node.id,
        content: replyContent.value
      }
    })
    replyContent.value = ''
    showReplyForm.value = false
    if (refreshComments) await refreshComments()
  } catch (err) {
    alert('Errore nell\'invio della risposta.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="text-[12px] font-sans text-[#222222]">
    <!-- Intestazione del commento (Meta-info) -->
    <div class="text-[10px] text-[#828282] flex items-center gap-1 mb-1 select-none">
      <span class="text-[#828282] text-[9px] cursor-pointer hover:text-black">▲</span>
      <span class="hover:underline cursor-pointer">anon_user_{{ node.id }}</span>
      <span>{{ new Date(node.createdAt).toLocaleDateString() }}</span>
      <span>at {{ new Date(node.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
    </div>
    
    <!-- Testo del commento principale -->
    <div class="text-[13px] text-black pl-3 max-w-[750px] leading-relaxed break-words whitespace-pre-line">
      {{ node.content }}
    </div>

    <!-- Bottone d'azione "reply" compatto -->
    <div class="pl-3 mt-1 mb-2">
      <button 
        @click="showReplyForm = !showReplyForm" 
        class="text-[10px] text-[#828282] underline hover:text-black"
      >
        {{ showReplyForm ? 'cancel' : 'reply' }}
      </button>
    </div>

    <!-- Box risposta condizionale (inline e minimale) -->
    <div v-if="showReplyForm" class="pl-3 my-2 max-w-[550px]">
      <textarea 
        v-model="replyContent"
        rows="3"
        class="w-full p-1 border border-gray-400 font-mono text-[12px] bg-white focus:outline-none"
        :disabled="isSubmitting"
      ></textarea>
      <div class="mt-1">
        <button 
          @click="handleReply"
          :disabled="isSubmitting"
          class="px-2 py-0.5 border border-gray-500 bg-[#e0e0e0] text-[11px] text-black"
        >
          {{ isSubmitting ? 'replying...' : 'add reply' }}
        </button>
      </div>
    </div>

    <!-- Indentazione progressiva per i nodi figli (Replies) -->
    <!-- Impostiamo un pl-6 per creare la classica alberatura a cascata senza bordi pesanti -->
    <div v-if="node.replies && node.replies.length > 0" class="pl-5 border-l border-transparent hover:border-gray-200 mt-2 space-y-4">
      <CommentNode v-for="reply in node.replies" :key="reply.id" :node="reply" />
    </div>
  </div>
</template>