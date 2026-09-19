<!-- app/pages/admin/index.vue -->
<script setup>
import { ref } from 'vue'

const adminSecret = ref('')
const postsList = ref([])
const loading = ref(false)
const errorMessage = ref('')

// Recupera i post invocando l'API protetta
const loadPosts = async () => {
  if (!adminSecret.value) {
    errorMessage.value = 'Inserisci il secret di amministrazione per caricare i dati.'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  postsList.value = []
  
  try {
    const clientFetch = useRequestFetch()
    const data = await clientFetch('/api/admin/posts', {
      headers: {
        // Usiamo l'header standard Bearer per allinearci al runtimeConfig sicuro del backend
        'Authorization': `Bearer ${adminSecret.value}`
      }
    })
    postsList.value = data
  } catch (err) {
    errorMessage.value = err.statusMessage || 'Errore nel caricamento dei post. Verifica la chiave.'
    postsList.value = []
  } finally {
    loading.value = false
  }
}

// Elimina un post specifico sfruttando il CASCADE su Neon
const deletePost = async (id) => {
  if (!confirm(`Sei sicuro di voler eliminare il post #${id}? L'azione eliminerà definitivamente anche tutti i commenti e i voti associati.`)) {
    return
  }

  try {
    const clientFetch = useRequestFetch()
    await clientFetch('/api/admin/posts', {
      method: 'DELETE',
      headers: {
        // Allineato all'autenticazione del backend
        'Authorization': `Bearer ${adminSecret.value}`
      },
      // Cambiato in postId per combaciare esattamente con readBody(event) del backend
      body: { postId: id }
    })
    
    // Rimuove il post dallo stato locale senza ricaricare la pagina
    postsList.value = postsList.value.filter(p => p.id !== id)
    alert('Post eliminato con successo!')
  } catch (err) {
    alert(`Impossibile eliminare il post: ${err.statusMessage || 'Errore di rete o autenticazione fallita'}`)
  }
}
</script>

<template>
  <div style="background-color: #f6f6ef; font-family: Verdana, Geneva, sans-serif; font-size: 10pt; color: #828282; padding: 10px; min-height: 100vh;">
    
    <!-- Barra superiore in pieno stile Hacker News -->
    <div style="background-color: #ff6600; padding: 4px; color: #000000; font-weight: bold; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 10pt;">
        <b>Hacker News Clone</b> <span style="font-weight: normal; font-size: 9pt;">| Dashboard Amministrazione</span>
      </span>
      <NuxtLink to="/" style="color: #000000; text-decoration: none; font-size: 9pt;">Torna alla Home</NuxtLink>
    </div>

    <!-- Modulo Autenticazione Autonoma -->
    <div style="background-color: #fff; padding: 10px; border: 1px solid #ccc; margin-bottom: 20px;">
      <label style="color: #000; font-weight: bold; margin-right: 10px; font-size: 9pt;">Secret Amministratore:</label>
      <input 
        v-model="adminSecret" 
        type="password" 
        placeholder="Inserisci la password di amministrazione..." 
        style="font-size: 9pt; padding: 2px; width: 260px;" 
        @keyup.enter="loadPosts"
      />
      <button @click="loadPosts" style="margin-left: 10px; font-size: 9pt; cursor: pointer; padding: 2px 6px;">
        Carica Post
      </button>
    </div>

    <!-- Sezione Messaggi di Errore o Stato -->
    <div v-if="errorMessage" style="color: #ff0000; font-weight: bold; margin-bottom: 15px; font-size: 9pt;">
      {{ errorMessage }}
    </div>
    
    <div v-if="loading" style="color: #000; margin-bottom: 15px; font-size: 9pt;">
      Connessione a Neon DB in corso...
    </div>

    <!-- Tabella dei Post Estrapolati -->
    <table v-if="postsList.length > 0" style="width: 100%; border-collapse: collapse; background-color: #fff; border: 1px solid #ddd;">
      <thead>
        <tr style="background-color: #e0e0d8; text-align: left; color: #000; font-size: 9pt;">
          <th style="padding: 6px; width: 60px;">ID</th>
          <th style="padding: 6px;">Titolo / URL del Link</th>
          <th style="padding: 6px; width: 180px;">Data Creazione</th>
          <th style="padding: 6px; width: 100px; text-align: center;">Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in postsList" :key="post.id" style="border-bottom: 1px solid #ddd; font-size: 9pt; color: #000;">
          <td style="padding: 6px; color: #828282;">#{{ post.id }}</td>
          <td style="padding: 6px;">
            <div style="font-weight: bold; color: #000;">{{ post.title }}</div>
            <div style="font-size: 8pt; color: #828282; word-break: break-all;">
              {{ post.url || 'Discussione interna (Senza URL)' }}
            </div>
          </td>
          <td style="padding: 6px; color: #555; font-size: 8pt;">
            {{ new Date(post.createdAt).toLocaleString('it-IT') }}
          </td>
          <td style="padding: 6px; text-align: center;">
            <button 
              @click="deletePost(post.id)" 
              style="background-color: #ff4444; color: white; border: 1px solid #cc0000; padding: 2px 6px; font-size: 8pt; cursor: pointer; border-radius: 2px;"
            >
              Elimina
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else-if="!loading && adminSecret && postsList.length === 0" style="color: #666; font-style: italic; font-size: 9pt;">
      Nessun post presente nel database o chiave non valida.
    </div>
  </div>
</template>