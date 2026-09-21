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
  if (!props.item?.createdAt) return ''
  const d = new Date(props.item.createdAt)
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
})

// Gestione del Voto
const voting = ref(false)
const points = ref(props.item?.points ?? 1)

async function vote() {
  if (voting.value) return
  voting.value = true
  try {
    const res: any = await $fetch(`/api/posts/${props.item.id}/vote`, {
      method: 'POST'
    })
    if (res?.points !== undefined) {
      points.value = res.points
    } else {
      points.value++
    }
  } catch (err: any) {
    if (err.statusCode === 409) {
      alert('Hai già votato questo post!')
    } else {
      console.error('Errore durante il voto:', err)
    }
  } finally {
    voting.value = false
  }
}
</script>

<template>
  <article class="post-item">
    <div class="post-title-line">
      <!-- Freccetta Voto -->
      <button class="vote-btn" @click="vote" :disabled="voting" title="Vota questo post">
        ▲
      </button>

      <!-- Titolo con Link esterno oppure dettaglio interno -->
      <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer" class="post-title">
        {{ item.title }}
      </a>
      <NuxtLink v-else :to="`/item/${item.id}`" class="post-title">
        {{ item.title }}
      </NuxtLink>

      <!-- Dominio Host -->
      <span v-if="host" class="post-host">({{ host }})</span>
    </div>

    <!-- Dettagli e Metadati -->
    <div class="post-meta">
      <span>{{ points }} {{ points === 1 ? 'punto' : 'punti' }}</span>
      <span class="sep">•</span>
      <span>da {{ item.author || 'Anonimo' }}</span>
      <span class="sep">•</span>
      <span>{{ formattedDate }}</span>
      <span class="sep">•</span>
      <NuxtLink :to="`/item/${item.id}`" class="comments-link">
        💬 {{ item.commentsCount || 0 }} commenti
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.post-item {
  padding: 0.35rem 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.post-title-line {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.vote-btn {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0 0.2rem;
  transition: color 0.15s ease;
}

.vote-btn:hover {
  color: #00dc82;
}

.post-title {
  color: #020420;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
}

.post-title:hover {
  color: #00dc82;
}

.post-host {
  color: #71717a;
  font-size: 0.8rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #71717a;
  margin-top: 0.15rem;
  padding-left: 0.8rem;
}

.sep {
  color: #d4d4d8;
}

.comments-link {
  color: #71717a;
  text-decoration: none;
}

.comments-link:hover {
  color: #00dc82;
  text-decoration: underline;
}
</style>