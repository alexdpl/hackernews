<!-- components/admin/AdminWhitelistManager.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface WhitelistEntry {
  id: number
  ip: string
  description: string
  addedBy: string
  createdAt: string
}

const whitelist = ref<WhitelistEntry[]>([])
const newIp = ref('')
const newDesc = ref('')
const loading = ref(true)

async function loadWhitelist() {
  loading.value = true
  try {
    const res = await fetch('/api/admin/whitelist')
    const json = await res.json()
    if (json.success) {
      whitelist.value = json.data || []
    }
  } catch (err) {
    console.error('Errore caricamento Whitelist:', err)
  } finally {
    loading.value = false
  }
}

async function addIp() {
  if (!newIp.value.trim()) return

  try {
    const res = await fetch('/api/admin/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: newIp.value, description: newDesc.value })
    })
    const json = await res.json()
    if (json.success) {
      newIp.value = ''
      newDesc.value = ''
      await loadWhitelist()
    } else {
      alert(json.message)
    }
  } catch (err: any) {
    alert('Errore aggiunta IP: ' + err.message)
  }
}

async function removeIp(id: number) {
  if (!confirm('Rimuovere questo IP dalla whitelist?')) return

  try {
    const res = await fetch(`/api/admin/whitelist?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      await loadWhitelist()
    }
  } catch (err: any) {
    alert('Errore rimozione IP: ' + err.message)
  }
}

onMounted(() => {
  loadWhitelist()
})
</script>

<template>
  <div class="whitelist-card">
    <div class="card-header">
      <div class="title-group">
        <span class="icon">🛡️</span>
        <div>
          <h3>IP Whitelist & Exemption Manager</h3>
          <p class="subtitle">Esenzioni trasparenti per sviluppatori e runner CI/CD</p>
        </div>
      </div>
    </div>

    <!-- FORM AGGIUNTA -->
    <form @submit.prevent="addIp" class="add-form">
      <input v-model="newIp" type="text" placeholder="Indirizzo IP (es. 192.168.1.50)" required class="input-field" />
      <input v-model="newDesc" type="text" placeholder="Descrizione (es. CI/CD GitHub Runner)" class="input-field desc" />
      <button type="submit" class="btn-add">+ Aggiungi</button>
    </form>

    <!-- LISTA WHITELIST -->
    <div v-if="loading" class="loading-state">Caricamento Whitelist...</div>
    <div v-else-if="whitelist.length === 0" class="empty-state">Nessun IP in Whitelist.</div>
    <div v-else class="table-container">
      <table class="wl-table">
        <thead>
          <tr>
            <th>IP</th>
            <th>DESCRIZIONE</th>
            <th>INSERITO DA</th>
            <th>AZIONI</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in whitelist" :key="item.id">
            <td class="ip-cell"><code>{{ item.ip }}</code></td>
            <td class="desc-cell">{{ item.description }}</td>
            <td class="by-cell">{{ item.addedBy }}</td>
            <td class="action-cell">
              <button @click="removeIp(item.id)" class="btn-del">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.whitelist-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  color: #f8fafc;
}

.card-header { margin-bottom: 1.25rem; }
.title-group { display: flex; align-items: center; gap: 0.75rem; }
.title-group .icon { font-size: 1.5rem; }
.title-group h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.subtitle { margin: 0; font-size: 0.8rem; color: #64748b; }

.add-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.input-field {
  background: #020420;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
}
.input-field.desc { flex-grow: 1; }

.btn-add {
  background: #00dc82;
  color: #020420;
  border: none;
  font-weight: 800;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.wl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.wl-table th {
  text-align: left;
  color: #64748b;
  padding: 0.5rem;
  border-bottom: 1px solid #1e293b;
}

.wl-table td {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
}

.ip-cell code { color: #00dc82; font-weight: 700; }
.desc-cell { color: #cbd5e1; }
.by-cell { color: #64748b; }

.btn-del {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-del:hover { background: #f43f5e; color: #ffffff; }

.loading-state, .empty-state { text-align: center; padding: 1.5rem; color: #64748b; }
</style>