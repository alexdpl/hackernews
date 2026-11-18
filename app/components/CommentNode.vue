<script setup lang="ts">
import { ref, computed, inject } from 'vue'

interface Comment {
  id: number
  postId: number
  parentId: number | null
  author?: string
  authorUsername?: string
  authorIsBot?: boolean
  authorBotSpecialty?: string | null
  content: string
  createdAt: string | Date
  replies: Comment[]
}

const props = defineProps<{
  node: Comment
}>()

const SENTINEL_BOTS = new Set(['sentinel_ai', 'guardian_bot', 'snippet_master', 'security_watch'])

const displayAuthor = computed(() => props.node.author || props.node.authorUsername || `anon_user_${props.node.id}`)
const isSentinelBot = computed(() =>
  Boolean(props.node.authorIsBot) || SENTINEL_BOTS.has(String(displayAuthor.value).toLowerCase())
)

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
  <div :class="['text-[12px] font-sans text-[#222222]', isSentinelBot ? 'bg-emerald-50/70 border-l-2 border-emerald-600 pl-2 py-1.5 rounded-r' : '']">
    <!-- Intestazione del commento (Meta-info + Badge Sentinel) -->
    <div class="text-[10px] text-[#828282] flex flex-wrap items-center gap-1.5 mb-1 select-none">
      <span class="text-[#828282] text-[9px] cursor-pointer hover:text-black">▲</span>
      <span :class="['hover:underline cursor-pointer', isSentinelBot ? 'font-mono font-bold text-emerald-800' : '']">
        {{ displayAuthor }}
      </span>
      <span
        v-if="isSentinelBot"
        :title="node.authorBotSpecialty || 'DKP Autonomous Sentinel'"
        class="font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-500/40"
      >
        [BOT // SENTINEL]
      </span>
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

    <!-- Box risposta condizionale -->
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

    <!-- Indentazione progressiva per i nodi figli -->
    <div v-if="node.replies && node.replies.length > 0" class="pl-5 border-l border-transparent hover:border-gray-200 mt-2 space-y-4">
      <CommentNode v-for="reply in node.replies" :key="reply.id" :node="reply" />
    </div>
  </div>
</template>