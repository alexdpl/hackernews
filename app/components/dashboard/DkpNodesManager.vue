<!-- app/components/dashboard/DkpNodesManager.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const { data, pending, refresh } = await useFetch('/api/user/nodes')

const threads = computed(() => data.value?.threads || [])
const comments = computed(() => data.value?.comments || [])

async function deleteThread(id: number) {
  if (!confirm('Eliminare definitivamente questo Thread? Tutti i commenti andranno persi.')) return
  await $fetch(`/api/nodes/posts/${id}`, { method: 'DELETE' })
  refresh()
}

async function deleteComment(id: number) {
  if (!confirm('Eliminare questo commento dal forum?')) return
  await $fetch(`/api/nodes/comments/${id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- SEZIONE THREADS -->
    <div class="manager-card">
      <div class="manager-header">
        <div>
          <h2>I Miei Thread (DKP Nodes)</h2>
          <p>Gestisci le discussioni che hai aperto nella community.</p>
        </div>
        <NuxtLink to="/nodes" class="post-link bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          + Nuovo Thread
        </NuxtLink>
      </div>

      <div v-if="pending" class="loading">Sincronizzazione con Neon DB...</div>
      
      <div v-else-if="threads.length > 0" class="table-wrapper">
        <table class="dkp-table">
          <thead>
            <tr>
              <th>TITOLO DISCUSSIONE</th>
              <th>NODO</th>
              <th>KARMA</th>
              <th>RISPOSTE</th>
              <th>DATA</th>
              <th>AZIONI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="thread in threads" :key="thread.id">
              <td class="font-bold text-slate-200">
                <NuxtLink :to="`/nodes/thread/${thread.id}`" class="hover:text-sky-400 transition-colors">
                  {{ thread.title }}
                </NuxtLink>
              </td>
              <td class="text-sky-400 font-mono text-xs">n/{{ thread.nodeSlug }}</td>
              <td class="font-mono text-emerald-400 font-bold">▲ {{ thread.karmaScore }}</td>
              <td class="font-mono">{{ thread.commentsCount }}</td>
              <td>{{ new Date(thread.createdAt).toLocaleDateString('it-IT') }}</td>
              <td class="actions">
                <button @click="deleteThread(thread.id)" class="btn-delete">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">Non hai ancora aperto nessuna discussione nei Nodi.</div>
    </div>

    <!-- SEZIONE COMMENTI -->
    <div class="manager-card">
      <div class="manager-header">
        <div>
          <h2>Le Mie Risposte (DKP Nodes)</h2>
          <p>Storico dei tuoi interventi nei thread del forum.</p>
        </div>
      </div>

      <div v-if="pending" class="loading">Sincronizzazione con Neon DB...</div>
      
      <div v-else-if="comments.length > 0" class="table-wrapper">
        <table class="dkp-table">
          <thead>
            <tr>
              <th>TESTO RISPOSTA</th>
              <th>COLLEGAMENTO</th>
              <th>KARMA</th>
              <th>DATA</th>
              <th>AZIONI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in comments" :key="comment.id">
              <td class="comment-text">"{{ comment.content.length > 60 ? comment.content.substring(0, 60) + '...' : comment.content }}"</td>
              <td>
                <NuxtLink :to="`/nodes/thread/${comment.postId}`" class="post-link">
                  Thread #{{ comment.postId }} ↗
                </NuxtLink>
              </td>
              <td class="font-mono text-emerald-400 font-bold">▲ {{ comment.karmaScore }}</td>
              <td>{{ new Date(comment.createdAt).toLocaleDateString('it-IT') }}</td>
              <td class="actions">
                <button @click="deleteComment(comment.id)" class="btn-delete">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">Non hai ancora risposto a nessun thread.</div>
    </div>
  </div>
</template>

<style scoped>
/* Riutilizziamo lo standard visivo esatto del DkpCommentsManager */
.manager-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
.manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.manager-header h2 { font-size: 1.3rem; font-weight: 800; margin: 0; color: #fff; }
.manager-header p { color: #94a3b8; font-size: 0.85rem; margin: 0; }
.table-wrapper { overflow-x: auto; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
.dkp-table th { color: #64748b; font-weight: 700; padding: 1rem; border-bottom: 1px solid #1e293b; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
.dkp-table td { padding: 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.comment-text { font-style: italic; color: #94a3b8; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.post-link { background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.3rem 0.6rem; border-radius: 6px; text-decoration: none; font-size: 0.75rem; font-weight: 700; transition: 0.2s; }
.post-link:hover { background: rgba(56, 189, 248, 0.2); }
.btn-delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.btn-delete:hover { background: rgba(239, 68, 68, 0.2); }
.empty, .loading { padding: 2rem; text-align: center; color: #64748b; font-family: monospace; font-size: 0.85rem; }
</style>