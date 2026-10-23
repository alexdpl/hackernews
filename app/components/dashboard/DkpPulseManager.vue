<script setup lang="ts">
import { ref, computed } from 'vue'

const { currentUser } = useAuthCore()

// Passiamo i parametri come query reattiva
const { data: userPosts, pending, refresh } = await useFetch('/api/pulse/user-stories', {
  query: { userId: computed(() => currentUser.value?.id || '') }
})

const posts = computed(() => userPosts.value?.data || [])

async function deletePost(id: number) {
  if (!confirm('Sei sicuro di voler eliminare questo post?')) return
  await $fetch(`/api/pulse/stories/${id}`, { method: 'DELETE' })
  refresh()
}
</script>
3. Modifica Sicurezza Backend - Commenti (

<template>
  <div class="manager-card">
    <div class="manager-header">
      <div>
        <h2>Gestione Feed (Ask/Show/Jobs)</h2>
        <p>I tuoi contributi al Tech Feed globale.</p>
      </div>
      <NuxtLink to="/submit" class="btn-primary">+ Nuovo Post Feed</NuxtLink>
    </div>

    <div v-if="pending" class="loading">Caricamento post...</div>
    
    <div v-else-if="posts.length > 0" class="table-wrapper">
      <table class="dkp-table">
        <thead>
          <tr>
            <th>TITOLO</th>
            <th>SEZIONE</th>
            <th>PUNTI</th>
            <th>DATA</th>
            <th>AZIONI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td class="font-bold">
              <NuxtLink :to="`/item/${post.id}`" class="text-link">{{ post.title }}</NuxtLink>
            </td>
            <td><span class="badge">{{ post.type?.toUpperCase() }}</span></td>
            <td class="text-green">▲ {{ post.points || 0 }}</td>
            <td>{{ new Date(post.createdAt || post.created_at).toLocaleDateString('it-IT') }}</td>
            <td class="actions">
              <button @click="deletePost(post.id)" class="btn-delete">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">Nessun post inviato al feed.</div>
  </div>
</template>

<style scoped>
/* Eredita lo stile dark esatto del tuo screenshot */
.manager-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
.manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.manager-header h2 { font-size: 1.3rem; font-weight: 800; margin: 0; color: #fff; }
.manager-header p { color: #94a3b8; font-size: 0.85rem; margin: 0; }
.btn-primary { background: #00dc82; color: #020420; font-weight: 800; padding: 0.6rem 1.2rem; border-radius: 6px; text-decoration: none; transition: 0.2s; }
.btn-primary:hover { box-shadow: 0 0 15px rgba(0,220,130,0.4); }

.table-wrapper { overflow-x: auto; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
.dkp-table th { color: #64748b; font-weight: 700; padding: 1rem; border-bottom: 1px solid #1e293b; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
.dkp-table td { padding: 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.badge { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; }
.text-green { color: #00dc82; font-weight: 800; }
.text-link { color: #fff; text-decoration: none; transition: 0.2s; }
.text-link:hover { color: #00dc82; }
.btn-delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.btn-delete:hover { background: rgba(239, 68, 68, 0.2); }
.empty, .loading { padding: 2rem; text-align: center; color: #64748b; }
</style>