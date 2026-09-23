<!-- app/pages/admin/jobs.vue -->
<script setup lang="ts">
import { ref } from 'vue'

interface JobPosition {
  id: string
  title: string
  department: string
  type: string
  status: 'Attiva' | 'Chiusa'
  candidates: number
}

const jobs = ref<JobPosition[]>([
  { id: '1', title: 'Senior Kernel Rust Engineer', department: 'Core Systems', type: 'Remote', status: 'Attiva', candidates: 14 },
  { id: '2', title: 'AI Neural Prompt Architect', department: 'AI Lab', type: 'Full-time', status: 'Attiva', candidates: 29 },
  { id: '3', title: 'Fullstack Nuxt 3 Specialist', department: 'Frontend', type: 'Remote', status: 'Attiva', candidates: 42 }
])

const newTitle = ref('')
const newDept = ref('Core Systems')
const newType = ref('Remote')
const successMessage = ref('')

function handleAddJob() {
  if (!newTitle.value.trim()) return
  jobs.value.unshift({
    id: Date.now().toString(),
    title: newTitle.value.trim(),
    department: newDept.value,
    type: newType.value,
    status: 'Attiva',
    candidates: 0
  })
  successMessage.value = '💼 Nuova posizione lavorativa aperta con successo!'
  newTitle.value = ''
  setTimeout(() => successMessage.value = '', 3000)
}

function toggleJobStatus(id: string) {
  const job = jobs.value.find(j => j.id === id)
  if (job) {
    job.status = job.status === 'Attiva' ? 'Chiusa' : 'Attiva'
  }
}

function deleteJob(id: string) {
  if (confirm('Eliminare questa posizione aperta?')) {
    jobs.value = jobs.value.filter(j => j.id !== id)
  }
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <div class="header-top-row">
        <span class="badge-tag">DKP Careers Management</span>
        <NuxtLink to="/admin" class="back-dashboard-btn">← Torna al Command Center</NuxtLink>
      </div>
      <h1>Jobs & Talent Acquisition</h1>
      <p>Gestisci le posizioni aperte nell'ecosistema DevKernelPulse e monitora i candidati.</p>
    </div>

    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <div class="admin-grid">
      <!-- Form Aggiunta Job -->
      <div class="admin-card">
        <h2>➕ Apri Nuova Posizione</h2>
        <p class="card-desc">Pubblica una nuova offerta di lavoro per ingegneri e sviluppatori.</p>

        <div class="form-group">
          <label>Titolo Posizione *</label>
          <input v-model="newTitle" type="text" placeholder="Es. Senior Security Auditor" />
        </div>

        <div class="form-group">
          <label>Dipartimento</label>
          <select v-model="newDept">
            <option value="Core Systems">Core Systems</option>
            <option value="AI Lab">AI Lab</option>
            <option value="Frontend">Frontend</option>
            <option value="Security">Security</option>
          </select>
        </div>

        <div class="form-group">
          <label>Tipologia Contratto</label>
          <select v-model="newType">
            <option value="Remote">Remote</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <button @click="handleAddJob" class="action-btn primary-btn">Pubblica Offerta</button>
      </div>

      <!-- Tabella Posizioni Aperte -->
      <div class="admin-card span-2">
        <h2>📋 Elenco Posizioni Attive ({{ jobs.length }})</h2>
        <p class="card-desc">Monitoraggio in tempo reale delle posizioni e candidature.</p>

        <div class="table-responsive">
          <table class="posts-table">
            <thead>
              <tr>
                <th>Posizione</th>
                <th>Dipartimento</th>
                <th>Tipo</th>
                <th>Candidati</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="j in jobs" :key="j.id">
                <td class="td-title">{{ j.title }}</td>
                <td><span class="table-dept">{{ j.department }}</span></td>
                <td>{{ j.type }}</td>
                <td class="stats-cell">👥 {{ j.candidates }}</td>
                <td>
                  <span :class="['status-badge', j.status === 'Attiva' ? 'active' : 'closed']">
                    {{ j.status }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button @click="toggleJobStatus(j.id)" class="edit-btn">Stato</button>
                  <button @click="deleteJob(j.id)" class="delete-btn">Elimina</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 1100px; margin: 2.5rem auto; padding: 0 1.5rem; }
.admin-header { margin-bottom: 2rem; }
.header-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.back-dashboard-btn { color: #00dc82; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.back-dashboard-btn:hover { text-decoration: underline; }
.badge-tag { background: rgba(0, 220, 130, 0.15); color: #00a862; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(0, 220, 130, 0.3); }
.admin-header h1 { font-size: 2rem; color: #020420; font-weight: 800; margin-top: 0.5rem; }
.admin-header p { color: #64748b; font-size: 0.95rem; }
.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #006636; padding: 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1.5rem; }
.admin-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
@media (max-width: 768px) { .admin-grid { grid-template-columns: 1fr; } }
.admin-card { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 2rem; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.admin-card h2 { font-size: 1.2rem; font-weight: 700; color: #00dc82; margin-bottom: 0.5rem; }
.card-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
label { display: block; font-size: 0.85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
input, select { width: 100%; background: #090d16; border: 1px solid #1e293b; color: #ffffff; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.9rem; outline: none; }
input:focus, select:focus { border-color: #00dc82; }
.action-btn { width: 100%; padding: 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: none; transition: opacity 0.2s; margin-top: 0.5rem; }
.primary-btn { background: #00dc82; color: #020420; }
.action-btn:hover { opacity: 0.9; }

/* Table */
.table-responsive { overflow-x: auto; }
.posts-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.posts-table th { background: #090d16; color: #94a3b8; padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; }
.posts-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.td-title { font-weight: 600; color: #ffffff; }
.table-dept { background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }
.stats-cell { font-weight: 700; color: #38bdf8; }
.status-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.status-badge.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.status-badge.closed { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.actions-cell { display: flex; gap: 0.5rem; }
.edit-btn { background: #38bdf8; color: #020420; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.delete-btn { background: #ef4444; color: #ffffff; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
</style>