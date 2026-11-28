<!-- app/components/nodes/DkpPagination.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalItems: number
    perPage?: number
    itemLabel?: string
  }>(),
  {
    perPage: 10,
    itemLabel: 'thread'
  }
)

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.perPage)))

const rangeStart = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.perPage + 1
})

const rangeEnd = computed(() => Math.min(props.currentPage * props.perPage, props.totalItems))

const visiblePages = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = props.currentPage
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let p = start; p <= end; p++) pages.push(p)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function goToPage(page: number) {
  const clamped = Math.min(Math.max(1, page), totalPages.value)
  if (clamped !== props.currentPage) {
    emit('update:currentPage', clamped)
  }
}
</script>

<template>
  <nav
    v-if="totalItems > 0"
    aria-label="Paginazione discussioni"
    class="bg-[#080e1e]/95 border border-slate-800 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs shadow-lg"
  >
    <!-- CONTATORE INTERVALLO -->
    <div class="text-slate-400 flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
      <span>
        Mostrando <strong class="text-cyan-300">{{ rangeStart }}&ndash;{{ rangeEnd }}</strong> di
        <strong class="text-white">{{ totalItems }}</strong> {{ itemLabel }}
      </span>
    </div>

    <!-- CONTROLLI PAGINA (CYAN / VIOLET DKP) -->
    <div v-if="totalPages > 1" class="flex items-center gap-1.5 flex-wrap justify-center">
      <button
        type="button"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
        class="px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#020617] border-slate-800 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
      >
        &larr; Prec
      </button>

      <template v-for="(item, idx) in visiblePages" :key="`${item}-${idx}`">
        <span v-if="item === '...'" class="px-2 text-slate-500 select-none">&hellip;</span>
        <button
          v-else
          type="button"
          @click="goToPage(item)"
          :aria-current="currentPage === item ? 'page' : undefined"
          :class="[
            'min-w-[34px] px-2.5 py-1.5 rounded-xl border font-extrabold transition-all cursor-pointer',
            currentPage === item
              ? 'bg-gradient-to-r from-cyan-500/25 to-violet-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22)]'
              : 'bg-[#020617] border-slate-800 text-slate-400 hover:border-violet-400/60 hover:text-violet-300'
          ]"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
        class="px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#020617] border-slate-800 text-slate-300 hover:border-violet-400 hover:text-violet-300"
      >
        Succ &rarr;
      </button>
    </div>
  </nav>
</template>