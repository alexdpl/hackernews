<!-- app/components/dashboard/DkpCommentsManager.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const { currentUser } = useAuthCore()

// Passiamo i parametri come query reattiva
const { data: userComments, pending, refresh } = await useFetch('/api/comments/user', {
  query: { username: computed(() => currentUser.value?.username || '') }
})

const comments = computed(() => userComments.value?.comments || [])

async function deleteComment(id: number) {
  if (!confirm('Eliminare definitivamente questo commento?')) return
  await $fetch(`/api/comments/${id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <div class="manager-card">
    <div class="manager-header">
      <div>
        <h2>Gestione Commenti</h2>
        <p>Moderazione e storico di tutti i tuoi commenti.</p>
      </div>
    </div>

    <div v-if="pending" class="loading">Caricamento commenti...</div>
    
    <div v-else-if="comments.length > 0" class="table-wrapper">
      <table class="dkp-table">
        <thead>
          <tr>
            <th>TESTO DEL COMMENTO</th>
            <th>COLLEGAMENTO</th>
            <th>DATA</th>
            <th>AZIONI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comment in comments" :key="comment.id">
            <td class="comment-text">"{{ comment.text.length > 60 ? comment.text.substring(0, 60) + '...' : comment.text }}"</td>
            <td>
              <NuxtLink :to="`/item/${comment.postId}`" class="post-link">
                Vai al Post #{{ comment.postId }} ↗
              </NuxtLink>
            </td>
            <td>{{ new Date(comment.createdAt).toLocaleDateString('it-IT') }}</td>
            <td class="actions">
              <button @click="deleteComment(comment.id)" class="btn-delete">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">Non hai ancora scritto nessun commento.</div>
  </div>
</template>

<style scoped>
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
.empty, .loading { padding: 2rem; text-align: center; color: #64748b; }
</style>