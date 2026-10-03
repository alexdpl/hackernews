<!-- app/pages/admin/jobs/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'Tech Jobs Hub v2.4-GOLD - DKP Admin Center',
  description: 'Gestione offerte di lavoro tech, pubblicazione annunci e sincronizzazione automatica.'
})

const { getMainUrl, getMailUrl } = useDomain()

interface Job {
  id?: string | number
  title: string
  company: string
  location: string
  type: 'remote' | 'hybrid' | 'onsite'
  tags: string
  salary?: string
  applyUrl: string
  description?: string
  isFeatured: boolean
  isActive: boolean
  createdAt?: string
}

// Stato Reattivo
const jobs = ref<Job[]>([
  {
    id: 1,
    title: 'Senior Nuxt / Vue Frontend Architect',
    company: 'Pulse Tech Corp',
    location: 'Remote (EU / Global)',
    type: 'remote',
    tags: 'Vue.js, Nuxt 3, TypeScript, Tailwind',
    salary: '€65.000 - €85.000 / anno',
    applyUrl: 'https://careers.pulsetech.io',
    description: 'Ricerchiamo uno sviluppatore Senior Nuxt per scalare le nostre architetture distribuite SaaS v2.4.',
    isFeatured: true,
    isActive: true,
    createdAt: '2026-10-01'
  },
  {
    id: 2,
    title: 'Full Stack Node.js & Neon DB Engineer',
    company: 'Nexus Cloud Systems',
    location: 'Milano / Hybrid',
    type: 'hybrid',
    tags: 'Node.js, PostgreSQL, Drizzle, Docker',
    salary: '€50.000 - €70.000 / anno',
    applyUrl: 'https://nexuscloud.io/jobs',
    description: 'Gestione ed ottimizzazione microservizi serverless su infrastrutture cloud ad alte prestazioni.',
    isFeatured: false,
    isActive: true,
    createdAt: '2026-09-28'
  }
])

const isLoading = ref(false)
const searchQuery = ref('')
const filterType = ref('all')

// Stato Modal Creazione/Modifica
const showModal = ref(false)
const isEditing = ref(false)
const currentJob = ref<Job>({
  title: '',
  company: '',
  location: 'Remote Global',
  type: 'remote',
  tags: 'TypeScript, Vue.js, Nuxt',
  salary: '€50.000 - €70.000',
  applyUrl: 'https://',
  description: '',
  isFeatured: false,
  isActive: true
})

// Gestione Toast Notifiche
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Fetch Jobs dall'API Admin
async function fetchJobs() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/jobs')
    if (res && res.jobs) {
      jobs.value = res.jobs
    }
  } catch (err) {
    // Mantieni i dati demo localmente se l'endpoint non risponde
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchJobs()
})

// Azioni Modal
function openCreateModal() {
  isEditing.value = false
  currentJob.value = {
    title: '',
    company: '',
    location: 'Remote Global',
    type: 'remote',
    tags: 'Vue 3, Nuxt, TypeScript',
    salary: '€45.000 - €65.000',
    applyUrl: 'https://',
    description: '',
    isFeatured: false,
    isActive: true
  }
  showModal.value = true
}

function openEditModal(job: Job) {
  isEditing.value = true
  currentJob.value = JSON.parse(JSON.stringify(job))
  showModal.value = true
}

// Salva o Aggiorna Lavoro
async function saveJob() {
  if (!currentJob.value.title || !currentJob.value.company || !currentJob.value.applyUrl) {
    triggerToast('❌ Compila Titolo, Azienda e Link di Candidatura!')
    return
  }

  isLoading.value = true
  try {
    if (isEditing.value && currentJob.value.id) {
      await $fetch(`/api/admin/jobs/${currentJob.value.id}`, {
        method: 'PUT',
        body: currentJob.value
      })
      const index = jobs.value.findIndex(j => j.id === currentJob.value.id)
      if (index !== -1) jobs.value[index] = { ...currentJob.value }
      triggerToast('✅ Offer di lavoro aggiornata con successo!')
    } else {
      const newId = Date.now()
      const newJobEntry = { ...currentJob.value, id: newId, createdAt: new Date().toISOString().split('T')[0] }
      await $fetch('/api/admin/jobs', {
        method: 'POST',
        body: newJobEntry
      }).catch(() => null)
      
      jobs.value.unshift(newJobEntry)
      triggerToast('🚀 Nuovo annuncio di lavoro pubblicato!')
    }
    showModal.value = false
  } catch (err: any) {
    triggerToast(`❌ Errore salvataggio: ${err.message || 'Server error'}`)
  } finally {
    isLoading.value = false
  }
}

// Toggle Rapido Visibilità / Featured
async function toggleStatus(job: Job, field: 'isActive' | 'isFeatured') {
  job[field] = !job[field]
  try {
    await $fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      body: { [field]: job[field] }
    })
    triggerToast(`Stato ${field === 'isActive' ? 'Pubblicazione' : 'In Evidenza'} aggiornato!`)
  } catch (err) {
    triggerToast(`Stato ${field === 'isActive' ? 'Pubblicazione' : 'In Evidenza'} modificato localmente.`)
  }
}

// Eliminazione Annuncio
async function deleteJob(id: string | number) {
  if (!confirm('Sei sicuro di voler eliminare definitivamente questo annuncio di lavoro?')) return

  try {
    await $fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    jobs.value = jobs.value.filter(j => j.id !== id)
    triggerToast('🗑️ Annuncio rimosso con successo.')
  } catch (err) {
    jobs.value = jobs.value.filter(j => j.id !== id)
    triggerToast('🗑️ Annuncio rimosso dal pannello.')
  }
}

// Importazione Diretta dal Crawler
async function syncJobsFromCrawler() {
  isLoading.value = true
  triggerToast('⏳ Avvio ingestione offerte Tech Jobs da RemoteOK...')
  try {
    const res: any = await $fetch('/api/admin/crawler/run', {
      method: 'POST',
      body: { section: 'jobs', limit: 10 }
    })
    triggerToast(`💼 Crawler completato: ${res.addedCount ?? 0} nuove offerte importate!`)
    fetchJobs()
  } catch (err) {
    triggerToast('❌ Errore durante l\'esecuzione del crawler jobs.')
  } finally {
    isLoading.value = false
  }
}

// Jobs Filtrati
const filteredJobs = computed(() => {
  return jobs.value.filter(j => {
    const matchesQuery = j.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         j.company.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         j.tags.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = filterType.value === 'all' || j.type === filterType.value
    return matchesQuery && matchesType
  })
})
</script>

<template>
  <div class="jobs-admin-panel">
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-icon">✅</span>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- NAVBAR GRID ADMIN UNIFICATA v2.4-GOLD -->
    <div class="admin-nav-container">
      <div class="admin-nav-top">
        <div class="nav-branding">
          <span class="status-dot green"></span>
          <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
        </div>

        <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <!-- GRID MODULI ADMIN -->
      <nav class="admin-grid-nav">
        <NuxtLink :to="getMainUrl('/admin/api-gateway')" external class="nav-tab btn-dashboard">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMailUrl('/admin/mail')" external class="nav-tab btn-dashboard">📧 Mail Center</NuxtLink>
        <NuxtLink :to="getMailUrl('/admin/newsletter')" external class="nav-tab btn-dashboard">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMailUrl('/admin/autoresponder')" external class="nav-tab btn-dashboard">📡 Autoresponder</NuxtLink>

        <NuxtLink :to="getMainUrl('/admin/crawler')" external class="nav-tab btn-dashboard">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" external class="nav-tab btn-dashboard">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" external class="nav-tab btn-dashboard">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" external class="nav-tab btn-dashboard active">💼 Gestione Jobs</NuxtLink>
      </nav>
    </div>

    <!-- HEADER HERO TECH JOBS HUB v2.4-GOLD -->
    <header class="panel-header">
      <div class="header-title">
        <div class="hero-badge">
          <span class="badge-status gold">DKP TECH JOBS HUB v2.4-GOLD</span>
        </div>
        <h2>Control Center <span class="brand-highlight">Opportunità Tech</span></h2>
        <p class="sub-lead">
          Pubblica annunci di lavoro tech, gestisci la visibilità in piattaforma e sincronizza i feed da RemoteOK.
        </p>
      </div>

      <div class="header-actions">
        <button @click="syncJobsFromCrawler" :disabled="isLoading" class="btn-secondary">
          ⚡ Importa da Crawler
        </button>
        <button @click="openCreateModal" class="btn-primary-action">
          ➕ Nuovo Annuncio
        </button>
      </div>
    </header>

    <!-- BARRA DI FILTRO E RICERCA -->
    <section class="controls-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cerca per titolo, azienda o tecnologia (es. Vue, Remote)..." 
          class="dark-input search-input" 
        />
      </div>

      <div class="filter-box">
        <select v-model="filterType" class="dark-input filter-select">
          <option value="all">🌐 Tutte le Tipologie</option>
          <option value="remote">💻 Full Remote</option>
          <option value="hybrid">🏢 Ibrido</option>
          <option value="onsite">📍 In Sede</option>
        </select>
      </div>
    </section>

    <!-- TABELLA / LISTA JOBS -->
    <section class="jobs-list-card">
      <div class="card-header">
        <h3>📋 Offerte di Lavoro Attive ({{ filteredJobs.length }})</h3>
      </div>

      <div class="table-responsive">
        <table class="jobs-table">
          <thead>
            <tr>
              <th>Ruolo & Azienda</th>
              <th>Modalità / Location</th>
              <th>Stack / Tags</th>
              <th>RAL / Compilazione</th>
              <th>Stato</th>
              <th class="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="job in filteredJobs" :key="job.id" :class="{ 'featured-row': job.isFeatured }">
              <td>
                <div class="job-role-info">
                  <span class="job-title">{{ job.title }}</span>
                  <span class="job-company">🏢 {{ job.company }}</span>
                </div>
              </td>
              <td>
                <span class="type-badge" :class="job.type">
                  {{ job.type.toUpperCase() }}
                </span>
                <div class="location-text">{{ job.location }}</div>
              </td>
              <td>
                <div class="tags-wrapper">
                  <span v-for="tag in job.tags.split(',')" :key="tag" class="tag-pill">
                    {{ tag.trim() }}
                  </span>
                </div>
              </td>
              <td>
                <span class="salary-text">{{ job.salary || 'Non specificata' }}</span>
              </td>
              <td>
                <div class="status-toggles">
                  <button 
                    @click="toggleStatus(job, 'isActive')" 
                    class="badge-toggle"
                    :class="job.isActive ? 'active' : 'inactive'"
                  >
                    {{ job.isActive ? 'Pubblicato' : 'Bozza' }}
                  </button>
                  <button 
                    @click="toggleStatus(job, 'isFeatured')" 
                    class="badge-toggle star"
                    :class="{ 'featured': job.isFeatured }"
                    title="Toggle in Evidenza"
                  >
                    ★
                  </button>
                </div>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button @click="openEditModal(job)" class="btn-icon edit" title="Modifica">✏️</button>
                  <a :href="job.applyUrl" target="_blank" class="btn-icon link" title="Apri Link Candidatura">🔗</a>
                  <button @click="deleteJob(job.id!)" class="btn-icon delete" title="Elimina Annuncio">🗑️</button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredJobs.length === 0">
              <td colspan="6" class="empty-state">
                Nessun annuncio di lavoro trovato con i filtri selezionati.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODAL CREAZIONE / MODIFICA -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? '✏️ Modifica Offerta di Lavoro' : '➕ Crea Nuovo Annuncio Tech' }}</h3>
          <button @click="showModal = false" class="btn-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="input-grid">
            <div class="input-group">
              <label>Titolo Posizione *</label>
              <input v-model="currentJob.title" type="text" placeholder="es. Senior Frontend Developer" class="dark-input" />
            </div>

            <div class="input-group">
              <label>Nome Azienda *</label>
              <input v-model="currentJob.company" type="text" placeholder="es. Pulse Tech Inc." class="dark-input" />
            </div>

            <div class="input-group">
              <label>Tipologia Lavoro</label>
              <select v-model="currentJob.type" class="dark-input">
                <option value="remote">Full Remote</option>
                <option value="hybrid">Ibrido</option>
                <option value="onsite">In Sede</option>
              </select>
            </div>

            <div class="input-group">
              <label>Sede / Fuso Orario</label>
              <input v-model="currentJob.location" type="text" placeholder="es. Remote (Worldwide) o Milano" class="dark-input" />
            </div>

            <div class="input-group full-width">
              <label>Stack Tecnologico / Tag (separati da virgola)</label>
              <input v-model="currentJob.tags" type="text" placeholder="es. Vue.js, Nuxt 3, TypeScript, Tailwind" class="dark-input" />
            </div>

            <div class="input-group">
              <label>Range Salariale (Opzionale)</label>
              <input v-model="currentJob.salary" type="text" placeholder="es. €50k - €70k / anno" class="dark-input" />
            </div>

            <div class="input-group">
              <label>URL Candidatura *</label>
              <input v-model="currentJob.applyUrl" type="url" placeholder="https://company.com/apply" class="dark-input" />
            </div>

            <div class="input-group full-width">
              <label>Descrizione Breve Posizione</label>
              <textarea v-model="currentJob.description" rows="3" placeholder="Descrivi i requisiti principali e i benefit dell'opportunità..." class="dark-input textarea"></textarea>
            </div>

            <div class="input-group full-width checkbox-group">
              <label class="checkbox-label">
                <input v-model="currentJob.isFeatured" type="checkbox" />
                <span>⭐ Metti l'annuncio In Evidenza (Featured)</span>
              </label>
              <label class="checkbox-label">
                <input v-model="currentJob.isActive" type="checkbox" />
                <span>🌐 Pubblica Immediatamente su DKP Platform</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-secondary">Annulla</button>
          <button @click="saveJob" :disabled="isLoading" class="btn-primary-action">
            💾 {{ isEditing ? 'Aggiorna Annuncio' : 'Pubblica Job' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   STILI NAVBAR ADMIN UNIFICATA v2.4-GOLD
   ========================================================================== */
.admin-nav-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}

.admin-nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-branding {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot.green {
  width: 8px;
  height: 8px;
  background-color: #00ff87;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff87;
}

.nav-title {
  color: #00f0ff;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.admin-grid-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.btn-dashboard {
  color: #00ff87;
  background: rgba(0, 255, 135, 0.04);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.btn-dashboard:hover,
.btn-dashboard.active {
  background: rgba(0, 255, 135, 0.12);
  border-color: #00ff87;
  box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);
  transform: translateY(-1px);
}

.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .admin-grid-nav { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 580px) {
  .admin-grid-nav { grid-template-columns: 1fr; }
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35);
  padding: 0.9rem 1.3rem;
  border-radius: 10px;
  backdrop-filter: blur(16px);
  max-width: 420px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }

/* ==========================================================================
   LAYOUT PANNELLO & HEADER HERO
   ========================================================================== */
.jobs-admin-panel {
  max-width: 1240px;
  margin: 0 auto;
  padding-bottom: 4rem;
  color: #f8fafc;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-badge { margin-bottom: 0.5rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.panel-header h2 {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 0.4rem 0;
  color: #ffffff;
}

.brand-highlight { color: #00dc82; }
.sub-lead { color: #94a3b8; font-size: 0.92rem; margin: 0; }

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-primary-action {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}

.btn-primary-action:hover:not(:disabled) {
  box-shadow: 0 0 18px rgba(0, 220, 130, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #020420;
  color: #f8fafc;
  font-weight: 700;
  border: 1px solid #1e293b;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(0, 220, 130, 0.08);
  border-color: #00dc82;
  color: #00dc82;
}

/* CONTROLS CARD */
.controls-card {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input {
  width: 100%;
  padding-left: 2.75rem !important;
}

.filter-box { width: 220px; }

.dark-input {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  width: 100%;
  transition: border-color 0.2s ease;
}

.dark-input:focus { border-color: #00dc82; }

/* TABLE CARD */
.jobs-list-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.card-header h3 {
  margin: 0 0 1.25rem 0;
  color: #00dc82;
  font-size: 1.15rem;
  font-weight: 800;
}

.table-responsive { overflow-x: auto; }

.jobs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  text-align: left;
}

.jobs-table th {
  padding: 0.85rem 1rem;
  color: #94a3b8;
  font-weight: 700;
  border-bottom: 1px solid #1e293b;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.jobs-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.featured-row { background: rgba(0, 220, 130, 0.03); }

.job-role-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.job-title {
  font-weight: 800;
  color: #ffffff;
}

.job-company {
  font-size: 0.8rem;
  color: #38bdf8;
}

.type-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.04em;
  margin-bottom: 0.2rem;
}

.type-badge.remote { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.type-badge.hybrid { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.type-badge.onsite { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }

.location-text { font-size: 0.78rem; color: #64748b; }

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tag-pill {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.salary-text { color: #facc15; font-weight: 700; font-size: 0.82rem; }

.status-toggles { display: flex; gap: 0.4rem; align-items: center; }

.badge-toggle {
  background: #020420;
  border: 1px solid #1e293b;
  color: #64748b;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s;
}

.badge-toggle.active {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border-color: #00dc82;
}

.badge-toggle.star.featured {
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
  border-color: #facc15;
}

.action-buttons {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

.btn-icon {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  border-color: #00dc82;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 3rem !important;
  color: #64748b;
}

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-content {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { margin: 0; color: #ffffff; font-size: 1.2rem; }

.btn-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}

@media (max-width: 600px) {
  .input-grid { grid-template-columns: 1fr; }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group.full-width { grid-column: 1 / -1; }

.input-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
}

.textarea { resize: vertical; }

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: #cbd5e1;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>