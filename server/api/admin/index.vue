<!-- app/pages/admin/index.vue -->
<script setup>
import { ref } from 'vue'

const adminSecret = ref('')
const postsList = ref([])
const loading = ref(false)
const errorMessage = ref('')

const loadPosts = async () => {
  if (!adminSecret.value) {
    errorMessage.value = 'Inserisci il secret di amministrazione per caricare i dati.'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const data = await \$fetch('/api/admin/posts', {
      headers: {
        'x-admin-secret': adminSecret.value
      }
    })
    postsList.value = data
  } catch (err) {
    errorMessage.value = err.statusMessage || 'Errore nel caricamento dei post.'
    postsList.value = []
  } finally {
    loading.value = false
  }
}

const deletePost = async (id) => {
  if (!confirm(`Sei sicuro di voler eliminare il post #${id}? L'azione eliminerà anche tutti i commenti e i voti associati.`)) {
    return
  }

  try {
    await \$fetch('/api/admin/posts', {
      method: 'DELETE',
      headers: {
        'x-admin-secret': adminSecret.value
      },
      body: { id }
    })
    
    postsList.value = postsList.value.filter(p => p.id !== id)
  } catch (err) {
    alert(`Impossibile eliminare il post: ${err.statusMessage || 'Errore di rete'}`)
  }
}
</script>
<template>
  <div style="background-color: #f6f6ef; font-family: Verdana, Geneva, sans-serif; font-size: 10pt; color: #828282; padding: 10px; min-height: 100vh;">
    
    <!-- Barra Superiore Header -->
    <div style="background-color: #ff6600; padding: 4px; color: #000000; font-weight: bold; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
      <span>Hacker News Clone — Dashboard Amministrazione</span>
      
      <!-- Menu di Navigazione in linea -->
      <div style="display: flex; gap: 15px; align-items: center;">
        <NuxtLink to="/admin/jobs" style="color: #000000; text-decoration: underline; font-size: 9pt; font-weight: bold;">
          Gestione Jobs (Nuovo Annuncio) →
        </NuxtLink>
        <span style="color: #000000; font-size: 9pt;">|</span>
        <NuxtLink to="/" style="color: #000000; text-decoration: none; font-size: 9pt;">
          Torna alla Home
        </NuxtLink>
      </div>
    </div>

    <!-- Sezione Inserimento Secret -->
    <div style="background-color: #fff; padding: 10px; border: 1px solid #ccc; margin-bottom: 20px;">
      <label style="color: #000; font-weight: bold; margin-right: 10px;">Secret Amministratore:</label>
      <input 
        v-model="adminSecret" 
        type="password" 
        placeholder="Inserisci password..." 
        style="font-size: 9pt; padding: 2px; width: 250px;" 
        @keyup.enter="loadPosts"
      />
      <button @click="loadPosts" style="margin-left: 10px; font-size: 9pt; cursor: pointer;">Carica Elenco Post</button>
    </div>

    <!-- Messaggi di Stato -->
    <div v-if="errorMessage" style="color: red; font-weight: bold; margin-bottom: 15px;">
      {{ errorMessage }}
    </div>
    
    <div v-if="loading" style="color: #000; margin-bottom: 15px;">
      Caricamento in corso da Neon DB...
    </div>

    <!-- Tabella dei Post Link -->
    <table v-if="postsList.length > 0" style="width: 100%; border-collapse: collapse; background-color: #fff;">
      <thead>
        <tr style="background-color: #e0e0d8; text-align: left; color: #000; font-size: 9pt;">
          <th style="padding: 5px; width: 60px;">ID</th>
          <th style="padding: 5px;">Titolo / URL</th>
          <th style="padding: 5px; width: 150px;">Data Creazione</th>
          <th style="padding: 5px; width: 100px; text-align: center;">Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in postsList" :key="post.id" style="border-bottom: 1px solid #ddd; font-size: 9pt;">
          <td style="padding: 5px; color: #000;">{{ post.id }}</td>
          <td style="padding: 5px;">
            <div style="color: #000; font-weight: bold;">{{ post.title }}</div>
            <div style="font-size: 8pt; color: #828282;">{{ post.url || 'Testo/Discussione interna' }}</div>
          </td>
          <td style="padding: 5px; color: #555;">
            {{ new Date(post.createdAt).toLocaleString() }}
          </td>
          <td style="padding: 5px; text-align: center;">
            <button 
              @click="deletePost(post.id)" 
              style="background-color: #ff4444; color: white; border: none; padding: 3px 8px; font-size: 8pt; cursor: pointer; border-radius: 2px;"
            >
              Elimina
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else-if="!loading && adminSecret && postsList.length === 0" style="color: #000; font-style: italic;">
      Nessun post trovato o dati non ancora richiesti.
    </div>
  </div>
</template>