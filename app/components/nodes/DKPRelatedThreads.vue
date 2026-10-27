<!-- app/components/nodes/DKPRelatedThreads.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentNodeSlug?: string
  currentPostId?: number
}>()

// Fetch dei thread recenti/hot correlati
const { data: postsRes } = await useFetch('/api/nodes/posts', {
  query: computed(() => ({
    sort: 'hot',
    nodeSlug: props.currentNodeSlug || undefined
  }))
})

const relatedPosts = computed(() => {
  const all = postsRes.value?.posts || []
  return all.filter((p: any) => p.id !== props.currentPostId).slice(0, 4)
})
</script>

<template>
  <div class="bg-[#090d16] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3 font-mono text-xs">
    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
      <h3 class="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
        <span>🔗</span> Discussioni Correlate
      </h3>
      <span class="text-[10px] text-sky-400 font-bold">DKP Nodes</span>
    </div>

    <div v-if="relatedPosts.length === 0" class="text-slate-500 text-[11px] italic py-2">
      Nessun altro thread trovato in questo nodo.
    </div>

    <div v-else class="flex flex-col gap-2.5">
      <NuxtLink 
        v-for="post in relatedPosts" 
        :key="post.id"
        :to="`/nodes/thread/${post.id}`"
        class="group flex flex-col gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 hover:border-sky-500/40 transition-all"
      >
        <div class="flex items-center justify-between text-[10px] text-slate-400">
          <span class="text-sky-400 font-bold">{{ post.nodeIcon }} {{ post.nodeName }}</span>
          <span>💬 {{ post.commentsCount }}</span>
        </div>
        <h4 class="font-semibold text-slate-200 group-hover:text-sky-400 transition-colors line-clamp-1 text-[11px]">
          {{ post.title }}
        </h4>
      </NuxtLink>
    </div>
  </div>
</template>