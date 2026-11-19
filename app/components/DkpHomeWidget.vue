<script setup lang="ts">
import { ref, onMounted } from 'vue'

const newsItems = ref<any[]>([])
const isLoading = ref(true)

async function fetchLiveCrawlerNews() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/news?limit=6&_t=${Date.now()}`).catch(() => null)
    const items = res?.data || res?.items || (Array.isArray(res) ? res : [])
    newsItems.value = items.slice(0, 6)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLiveCrawlerNews)
</script>

<template>
  <div class="bg-dkp-card border border-dkp-border rounded-lg p-6 card-glow">
    <div class="flex items-center justify-between mb-4 border-b border-dkp-border pb-3">
      <div class="flex items-center gap-2.5">
        <span class="status-dot bg-dkp-accent text-dkp-accent"></span>
        <h3 class="text-lg font-bold text-dkp-text m-0 font-display">🤖 Crawler AI — Live Tech Feed</h3>
      </div>
      <button
        type="button"
        @click="fetchLiveCrawlerNews"
        class="text-xs font-mono text-dkp-accent hover:text-white bg-dkp-bg border border-dkp-border px-2.5 py-1 rounded cursor-pointer"
      >
        🔄 Sync
      </button>
    </div>

    <div v-if="isLoading" class="py-6 text-center font-mono text-xs text-dkp-accent animate-pulse">
      ⚡ Interrogazione pipeline Pure SQL in corso...
    </div>

    <div v-else-if="newsItems.length === 0" class="py-6 text-center font-mono text-xs text-dkp-muted">
      Nessuna news recente in coda. Avvia il Crawler dal Control Panel.
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="item in newsItems"
        :key="item.id"
        class="border-b border-dkp-border/60 last:border-none pb-3 last:pb-0 flex items-start justify-between gap-3"
      >
        <div>
          <a
            :href="item.url || `/item/${item.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-bold text-dkp-text hover:text-dkp-accent no-underline transition-colors block"
          >
            {{ item.title }}
          </a>
          <div class="flex items-center gap-3 mt-1 font-mono text-[11px] text-dkp-muted">
            <span class="text-dkp-accent">[AI-INDEXED]</span>
            <span>▲ {{ item.points || item.score || 1 }} pts</span>
            <span>by {{ item.author || 'crawler_bot' }}</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>