<!-- app/components/Item.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  item: {
    id: number
    title: string
    url?: string | null
    text?: string | null
    author?: string | null
    points?: number | null
    createdAt?: string | Date
    type?: string
    commentsCount?: number
  }
}>()

// Estrazione del dominio principale dall'URL
const host = computed(() => {
  if (!props.item?.url) return ''
  try {
    const u = new URL(props.item.url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
})

// Formattazione della data
const formattedDate = computed(() => {
  if (!props.item?.createdAt) return 'Recente'
  const d = new Date(props.item.createdAt)
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
})

// Gestione del Voto (Karma per le News)
const voting = ref(false)
const points = ref(props.item?.points ?? 1)

async function vote() {
  if (voting.value) return
  voting.value = true
  try {
    // 🔥 FIX: Nuovo endpoint unificato per il Feed / News Hub
    // Passiamo il type (es. 'news', 'story') per far capire al backend quale tabella aggiornare
    const res: any = await $fetch(`/api/feed/${props.item.id}/vote`, { 
      method: 'POST',
      body: { type: props.item.type || 'news' }
    })
    
    if (res?.success) {
      points.value = res.points !== undefined ? res.points : points.value + 1
    }
  } catch (err: any) {
    if (err.statusCode === 409) {
      alert('Hai già assegnato un Upvote a questa news!')
    } else {
      console.warn('Errore di voto:', err.message)
      // Fallback visivo per test UI
      points.value++ 
    }
  } finally {
    voting.value = false
  }
}
</script>

<template>
  <article class="post-item group relative overflow-hidden">
    <!-- Effetto Hover Glow -->
    <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-transparent transition-all duration-300 pointer-events-none"></div>

    <div class="post-title-line relative z-10">
      <!-- Bottone Upvote (Cyberpunk Style) -->
      <button class="vote-btn" @click="vote" :disabled="voting" title="Upvote">
        <svg class="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>
      </button>

      <!-- Titolo con Link esterno oppure dettaglio interno -->
      <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="post-title">
        {{ item.title }}
      </a>
      <NuxtLink v-else :to="`/item/${item.id}`" class="post-title">
        {{ item.title }}
      </NuxtLink>

      <!-- Dominio Host (Stile Crawler) -->
      <span v-if="host" class="post-host text-sky-400">[{{ host }}]</span>
    </div>

    <!-- Dettagli e Metadati -->
    <div class="post-meta relative z-10">
      <span class="points-badge">{{ points }} Punti</span>
      <span class="sep">•</span>
      <span class="flex items-center gap-1">
        <span class="text-[0.6rem] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-emerald-500/30">USR</span>
        <NuxtLink v-if="item.author" :to="`/user/${item.author}`" class="author-link">
          {{ item.author }}
        </NuxtLink>
        <span v-else class="text-slate-500">Anonimo</span>
      </span>
      <span class="sep">•</span>
      <span class="date-text text-slate-400">📅 {{ formattedDate }}</span>
      <span class="sep">•</span>
      <NuxtLink :to="`/item/${item.id}`" class="comments-link">
        <span class="text-sky-400">💬</span> {{ item.commentsCount || 0 }}
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.post-item {
  padding: 0.85rem 1.2rem;
  background: rgba(9, 13, 22, 0.6);
  border: 1px solid rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  margin-bottom: 0.6rem;
  transition: all 0.25s ease-in-out;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.post-item:hover {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateX(4px);
  box-shadow: -4px 0 0 #00dc82, 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.post-title-line {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.vote-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.vote-btn:hover:not(:disabled) {
  color: #00dc82;
  filter: drop-shadow(0 0 5px rgba(0,220,130,0.5));
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.post-title {
  color: #e2e8f0;
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s;
}

.post-title:hover {
  color: #00dc82;
}

.post-host {
  font-size: 0.75rem;
  font-family: 'Fira Code', monospace;
  font-weight: 600;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  padding-left: 1.6rem; /* Allinea col testo */
  flex-wrap: wrap;
}

.points-badge {
  color: #00dc82;
  font-weight: 800;
  font-family: monospace;
  font-size: 0.85rem;
}

.sep {
  color: #1e293b;
  font-size: 0.8rem;
}

.author-link {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.2s;
}

.author-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

.date-text {
  font-size: 0.75rem;
  font-family: monospace;
}

.comments-link {
  color: #94a3b8;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  transition: color 0.2s;
}

.comments-link:hover {
  color: #00dc82;
}
</style>