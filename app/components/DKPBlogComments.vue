<!-- app/components/DKPBlogComments.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  blogSlug: string
}>()

const { data: response, refresh, error } = await useFetch('/api/blog/comments', {
  query: { slug: props.blogSlug }
})

const comments = computed(() => response.value?.comments || [])

const newCommentText = ref('')
const authorName = ref('alexdpl')
const isSubmitting = ref(false)
const successMessage = ref('')

const submitComment = async () => {
  if (!newCommentText.value.trim()) return

  isSubmitting.value = true
  successMessage.value = ''

  try {
    const res: any = await $fetch('/api/blog/comments', {
      method: 'POST',
      body: {
        blogSlug: props.blogSlug,
        content: newCommentText.value,
        author: authorName.value,
        userId: 1
      }
    })

    if (res?.success) {
      newCommentText.value = ''
      successMessage.value = res.message || 'Commento aggiunto! +10 XP ⚡'
      refresh()
    }
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Errore durante la pubblicazione del commento.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="blog-comments-section mt-12 pt-8 border-t border-slate-800 font-sans">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-extrabold text-white flex items-center gap-2">
        <span>💬</span> Discussione & Commenti DKP (<span class="text-emerald-400">{{ comments.length }}</span>)
      </h3>
      <span class="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-mono font-bold">+10 XP per commento</span>
    </div>

    <!-- FORM INSERIMENTO COMMENTO -->
    <div class="comment-form bg-slate-900/80 border border-slate-800 p-4 rounded-xl mb-8">
      <div class="mb-3">
        <input 
          v-model="authorName" 
          type="text" 
          placeholder="Tuo Username..." 
          class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 outline-none font-mono"
        />
      </div>
      <textarea 
        v-model="newCommentText" 
        rows="3" 
        placeholder="Scrivi un commento tecnico o un feedback costruttivo..."
        class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none resize-none"
      ></textarea>
      
      <div class="flex justify-between items-center mt-3">
        <span v-if="successMessage" class="text-xs text-emerald-400 font-mono font-bold">{{ successMessage }}</span>
        <span v-else class="text-xs text-slate-500">Supporta markdown leggero & codice</span>

        <button 
          @click="submitComment" 
          :disabled="isSubmitting || !newCommentText.trim()"
          class="px-5 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <span v-if="!isSubmitting">Pubblica Commento ⚡</span>
          <span v-else>Invio in corso...</span>
        </button>
      </div>
    </div>

    <!-- LISTA COMMENTI -->
    <div v-if="error" class="text-red-400 text-sm p-4 bg-red-950/30 border border-red-900 rounded-lg">
      Impossibile caricare i commenti in questo momento.
    </div>

    <div v-else-if="comments.length === 0" class="text-slate-500 text-sm text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800/60">
      Ancora nessun commento. Sii il primo a rompere il ghiaccio in questo articolo! 🚀
    </div>

    <div v-else class="space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="comment-card bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl transition hover:border-emerald-500/30">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
              {{ comment.author.charAt(0).toUpperCase() }}
            </span>
            <span class="text-sm font-bold text-slate-200">{{ comment.author }}</span>
          </div>
          <span class="text-[11px] text-slate-500 font-mono">
            {{ new Date(comment.createdAt).toLocaleDateString() }}
          </span>
        </div>
        <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
          {{ comment.content }}
        </p>
      </div>
    </div>
  </div>
</template>