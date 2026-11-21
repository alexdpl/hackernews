<script setup lang="ts">
import { ref, computed } from 'vue'
import { buildNodeThreadSlug, cleanNodeLabel } from '~/composables/useDkpNodes'

const props = defineProps<{
  thread: any
  canModerate?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-lock', thread: any): void
}>()

const hasVoted = ref(false)
const localKarma = ref(Number(props.thread.karmaScore ?? props.thread.karma ?? 0))

function upvoteThread() {
  if (hasVoted.value) {
    localKarma.value--
    hasVoted.value = false
  } else {
    localKarma.value++
    hasVoted.value = true
  }
}

const cleanNodeSlug = computed(() =>
  String(props.thread.nodeSlug || 'general').replace(/^(n\/)+/i, '').trim().toLowerCase()
)

const cleanNodeName = computed(() =>
  cleanNodeLabel(props.thread.nodeName || props.thread.nodeSlug || 'general')
)

const targetLink = computed(() => {
  if (props.thread.sourceType === 'blog' && props.thread.slug) {
    return `/blog/${props.thread.slug}`
  }
  const cleanId = String(props.thread.id || '').replace(/^blog-/, '')
  if (props.thread.sourceType === 'blog') return '/blog'
  const threadSlug = props.thread.slug || buildNodeThreadSlug(cleanId, props.thread.title)
  return `/nodes/post/${threadSlug}`
})

const normalizedTags = computed<string[]>(() => {
  const raw = props.thread?.tags
  const list = Array.isArray(raw)
    ? raw
    : (typeof raw === 'string' && raw.trim()
        ? (raw.trim().startsWith('[') ? (() => { try { return JSON.parse(raw) } catch { return raw.split(',') } })() : raw.split(','))
        : [])
  return Array.from(new Set(list.map((t: any) => String(t || '').trim().replace(/^#+/, '')).filter(Boolean)))
})

const excerptText = computed(() => {
  const raw = String(props.thread.excerpt || props.thread.content || '')
    .replace(/```[\s\S]*?```/g, ' [codice] ')
    .replace(/[#*`>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return raw.length > 260 ? `${raw.slice(0, 260)}...` : raw
})

const formattedDate = computed(() => {
  if (!props.thread.createdAt) return 'Oggi'
  return new Date(props.thread.createdAt).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
})
</script>

<template>
  <article class="bg-[#090d16] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 transition-all card-glow flex gap-3.5 sm:gap-4">
    <div class="flex flex-col items-center justify-start bg-[#020420] border border-slate-800 rounded-xl px-2.5 py-2 h-fit shrink-0 font-mono">
      <button
        type="button"
        @click="upvoteThread"
        :class="[
          'text-sm font-black cursor-pointer bg-transparent border-none p-0 transition-transform active:scale-125',
          hasVoted ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'
        ]"
        title="Vota discussione"
      >
        &#9650;
      </button>
      <span :class="['text-xs font-bold mt-0.5', hasVoted ? 'text-emerald-400' : 'text-white']">
        {{ localKarma }}
      </span>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-2">
      <div class="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            :to="`/nodes/n/${cleanNodeSlug}`"
            class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold no-underline hover:bg-emerald-500/20"
          >
            n/{{ cleanNodeName }}
          </NuxtLink>

          <span
            v-if="thread.sourceType === 'blog'"
            class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase"
          >
            BLOG NOTARIZZATO
          </span>

          <NuxtLink
            :to="`/user/${thread.authorUsername || thread.authorName || 'alexdpl'}`"
            class="text-slate-200 hover:text-emerald-400 font-bold no-underline"
          >
            @{{ thread.authorUsername || thread.authorName || 'dkp_dev' }}
          </NuxtLink>

          <span
            v-for="badge in (thread.authorBadges || [])"
            :key="badge"
            class="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
          >
            {{ badge }}
          </span>

          <span v-if="thread.isPinned" class="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
            PINNED
          </span>

          <span v-if="thread.isLocked" class="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold">
            CHIUSO
          </span>

          <span class="text-slate-500 text-[11px]">&bull; {{ formattedDate }}</span>
        </div>

        <button
          v-if="canModerate && thread.sourceType !== 'blog'"
          type="button"
          @click="emit('toggle-lock', thread)"
          class="px-2.5 py-1 rounded-lg bg-[#020420] border border-slate-700 hover:border-amber-400 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors"
        >
          {{ thread.isLocked ? 'Riapri' : 'Chiudi' }}
        </button>
      </div>

      <NuxtLink
        :to="targetLink"
        class="text-base sm:text-lg font-bold text-white hover:text-emerald-400 transition-colors no-underline leading-snug"
      >
        {{ thread.title }}
      </NuxtLink>

      <p v-if="excerptText" class="text-xs sm:text-sm text-slate-300 m-0 line-clamp-2 leading-relaxed">
        {{ excerptText }}
      </p>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-800/70 font-mono text-[11px]">
        <div class="flex flex-wrap items-center gap-1.5">
          <span
            v-for="(tag, idx) in normalizedTags"
            :key="`${tag}-${idx}`"
            class="px-2 py-0.5 rounded bg-[#050a14] border border-cyan-500/25 text-cyan-300"
          >
            #{{ tag }}
          </span>
        </div>

        <div class="flex items-center gap-3 text-slate-400">
          <span
            v-if="thread.vaultHash"
            class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold"
            :title="`SHA-256: ${thread.vaultHash}`"
          >
            SHA-256: {{ String(thread.vaultHash).substring(0, 14) }}...
          </span>

          <NuxtLink :to="targetLink" class="text-slate-300 hover:text-emerald-400 no-underline font-bold">
            {{ thread.commentsCount ?? 0 }} risposte
          </NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>