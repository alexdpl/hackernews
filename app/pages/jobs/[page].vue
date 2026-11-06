<!-- app/pages/jobs/[page].vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 10

const { data: jobsRes, pending, error } = await useFetch('/api/jobs', {
  query: { page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

const jobs = computed(() => jobsRes.value?.jobs || jobsRes.value?.data || [])
const pagination = computed(() => jobsRes.value?.pagination || {})
const totalPages = computed(() => pagination.value?.totalPages || 1)
const hasMore = computed(() => currentPage.value < totalPages.value)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/jobs/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push('/jobs')
  } else {
    router.push(`/jobs/${currentPage.value - 1}`)
  }
}

useHead({
  title: `Offerte di Lavoro Tech - Pagina ${currentPage.value} - DevKernelPulse`
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white">💼 Offerte di Lavoro <span class="text-emerald-400">Tech</span></h1>
          <p class="text-xs text-slate-400 mt-1">Stai visualizzando la <strong>Pagina {{ currentPage }} di {{ totalPages }}</strong>.</p>
        </div>
        <NuxtLink to="/jobs" class="text-xs font-mono font-bold text-sky-400 hover:underline">← Torna alla prima pagina</NuxtLink>
      </div>

      <div v-if="error" class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-red-400 font-mono text-xs">
        Errore nel caricamento delle offerte.
      </div>

      <div v-else-if="pending" class="text-center py-12 text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Caricamento offerte di lavoro...
      </div>

      <div v-else-if="jobs.length > 0" class="flex flex-col gap-4">
        <article v-for="job in jobs" :key="job.id" class="bg-[#090d16] border border-slate-800 rounded-xl p-5 hover:border-emerald-500/40 transition-all flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 class="text-base font-bold text-white hover:text-emerald-400">
              <NuxtLink :to="`/jobs/${job.id}`">{{ job.title }}</NuxtLink>
            </h2>
            <p class="text-xs text-slate-400 mt-1">{{ job.company }} • {{ job.location || 'Remote' }}</p>
          </div>
          <NuxtLink :to="`/jobs/${job.id}`" class="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all">
            Dettagli ↗
          </NuxtLink>
        </article>

        <div class="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-slate-800 font-mono text-xs">
          <button @click="handlePrevPage" :disabled="currentPage <= 1 || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg disabled:opacity-40">
            ← Precedente
          </button>
          <span class="text-slate-400">Pagina {{ currentPage }} / {{ totalPages }}</span>
          <button @click="handleNextPage" :disabled="!hasMore || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg disabled:opacity-40">
            Successiva →
          </button>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 font-mono text-xs">
        Nessuna offerta in questa pagina.
      </div>

    </div>
  </div>
</template>