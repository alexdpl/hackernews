<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

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
    description: 'Ricerchiamo uno sviluppatore Senior Nuxt per scalare le nostre architetture distribuite SaaS v2.6.',
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

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

async function fetchJobs() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/jobs')
    if (res && res.jobs) {
      jobs.value = res.jobs
    }
  } catch {
    // Mantieni i dati locali se l'endpoint non risponde
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchJobs()
})

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

async function saveJob() {
  if (!currentJob.value.title || !currentJob.value.company || !currentJob.value.applyUrl) {
    triggerToast('Compila Titolo, Azienda e Link di Candidatura!', 'warning')
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
      triggerToast('Offerta di lavoro aggiornata con successo!', 'success')
    } else {
      const newId = Date.now()
      const newJobEntry = { ...currentJob.value, id: newId, createdAt: new Date().toISOString().split('T')[0] }
      await $fetch('/api/admin/jobs', {
        method: 'POST',
        body: newJobEntry
      }).catch(() => null)

      jobs.value.unshift(newJobEntry)
      triggerToast('Nuovo annuncio di lavoro pubblicato!', 'success')
    }
    showModal.value = false
  } catch (err: any) {
    triggerToast(`Errore salvataggio: ${err.message || 'Server error'}`, 'error')
  } finally {
    isLoading.value = false
  }
}

async function toggleStatus(job: Job, field: 'isActive' | 'isFeatured') {
  job[field] = !job[field]
  try {
    await $fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      body: { [field]: job[field] }
    })
    triggerToast(`Stato ${field === 'isActive' ? 'Pubblicazione' : 'In Evidenza'} aggiornato!`, 'success')
  } catch {
    triggerToast(`Stato ${field === 'isActive' ? 'Pubblicazione' : 'In Evidenza'} modificato localmente.`, 'warning')
  }
}

async function deleteJob(id: string | number) {
  if (!confirm('Sei sicuro di voler eliminare definitivamente questo annuncio di lavoro?')) return

  try {
    await $fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    jobs.value = jobs.value.filter(j => j.id !== id)
    triggerToast('Annuncio rimosso con successo.', 'success')
  } catch {
    jobs.value = jobs.value.filter(j => j.id !== id)
    triggerToast('Annuncio rimosso dal pannello.', 'warning')
  }
}

async function syncJobsFromCrawler() {
  isLoading.value = true
  triggerToast('Avvio ingestione offerte Tech Jobs da RemoteOK...', 'warning')
  try {
    const res: any = await $fetch('/api/admin/crawler/run', {
      method: 'POST',
      body: { section: 'jobs', limit: 10 }
    })
    triggerToast(`Crawler completato: ${res.addedCount ?? 0} nuove offerte importate!`, 'success')
    await fetchJobs()
  } catch {
    triggerToast('Errore durante l\'esecuzione del crawler jobs.', 'error')
  } finally {
    isLoading.value = false
  }
}

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
  <DkpAdminShell
    title="Control Center Opportunità Tech"
    subtitle="Pubblica annunci di lavoro tech, gestisci la visibilità in piattaforma e sincronizza i feed in tempo reale da RemoteOK."
    badge="DKP TECH JOBS HUB v2.6-PURE-SQL"
    seo-title="Tech Jobs Hub v2.6 — DKP Admin Center"
    seo-description="Gestione offerte di lavoro tech, pubblicazione annunci e sincronizzazione automatica."
  >
    <template #actions>
      <button
        type="button"
        @click="syncJobsFromCrawler"
        :disabled="isLoading"
        class="px-4 py-2.5 rounded-xl font-bold text-xs bg-dkp-bg border border-dkp-border hover:border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
      >
        <span :class="{ 'animate-spin inline-block': isLoading }"></span> Importa da Crawler
      </button>
      <button
        type="button"
        @click="openCreateModal"
        class="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none transition-all shadow-[0_0_15px_rgba(0,220,130,0.3)] cursor-pointer"
      >
        + Nuovo Annuncio
      </button>
    </template>

    <!-- FLOATING TOAST -->
    <div
      v-if="showToast"
      :class="[
        'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs font-semibold',
        toastType === 'success' ? 'bg-[#041a13]/95 border-emerald-500/50 text-emerald-300' :
        toastType === 'error' ? 'bg-[#1e070a]/95 border-rose-500/50 text-rose-300' :
        'bg-[#1a1403]/95 border-amber-500/50 text-amber-300'
      ]"
    >
      <span>{{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}</span>
      <span>{{ toastMessage }}</span>
    </div>

    <!-- BARRA DI FILTRO E RICERCA -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 sm:p-5 card-glow flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cerca per titolo, azienda o tecnologia (es. Vue, Remote)..."
          class="w-full bg-dkp-bg border border-dkp-border px-4 py-2.5 rounded-xl text-slate-100 text-xs outline-none focus:border-emerald-500 transition-all font-mono box-border"
        />
      </div>

      <div class="flex items-center gap-3 font-mono text-xs">
        <label class="text-slate-400 font-bold whitespace-nowrap">Modalit&agrave;:</label>
        <select
          v-model="filterType"
          class="bg-dkp-bg border border-dkp-border text-emerald-400 px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
        >
          <option value="all">Tutte le Tipologie</option>
          <option value="remote">Full Remote</option>
          <option value="hybrid">Ibrido</option>
          <option value="onsite">In Sede</option>
        </select>
      </div>
    </section>

    <!-- TABELLA JOBS -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow">
      <div class="p-5 border-b border-dkp-border flex justify-between items-center">
        <h3 class="text-emerald-400 font-extrabold text-base m-0 font-mono">
          Offerte di Lavoro Attive ({{ filteredJobs.length }})
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-dkp-bg text-slate-400 font-extrabold text-[11px] uppercase border-b border-dkp-border font-mono">
              <th class="p-4">Ruolo &amp; Azienda</th>
              <th class="p-4">Modalit&agrave; / Location</th>
              <th class="p-4">Stack / Tags</th>
              <th class="p-4">RAL / Compenso</th>
              <th class="p-4">Stato</th>
              <th class="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="job in filteredJobs"
              :key="job.id"
              :class="[
                'border-b border-dkp-border/60 hover:bg-slate-900/40 transition-colors',
                job.isFeatured ? 'bg-emerald-500/5' : ''
              ]"
            >
              <td class="p-4">
                <div class="flex flex-col">
                  <strong class="text-white font-bold text-sm">{{ job.title }}</strong>
                  <span class="text-sky-400 text-xs font-mono">{{ job.company }}</span>
                </div>
              </td>
              <td class="p-4 font-mono">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block mb-1 border',
                    job.type === 'remote' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    job.type === 'hybrid' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' :
                    'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ job.type.toUpperCase() }}
                </span>
                <div class="text-[11px] text-slate-400">{{ job.location }}</div>
              </td>
              <td class="p-4">
                <div class="flex flex-wrap gap-1 max-w-xs font-mono">
                  <span
                    v-for="tag in job.tags.split(',')"
                    :key="tag"
                    class="bg-dkp-bg border border-dkp-border text-slate-300 px-2 py-0.5 rounded text-[10px]"
                  >
                    {{ tag.trim() }}
                  </span>
                </div>
              </td>
              <td class="p-4 font-mono">
                <span class="text-amber-400 font-bold text-xs">{{ job.salary || 'Non specificata' }}</span>
              </td>
              <td class="p-4 font-mono">
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="toggleStatus(job, 'isActive')"
                    :class="[
                      'px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer',
                      job.isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                    ]"
                  >
                    {{ job.isActive ? 'Pubblicato' : 'Bozza' }}
                  </button>
                  <button
                    type="button"
                    @click="toggleStatus(job, 'isFeatured')"
                    :class="[
                      'px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer',
                      job.isFeatured ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-600 border-slate-700'
                    ]"
                    title="Toggle in Evidenza"
                  >
                    
                  </button>
                </div>
              </td>
              <td class="p-4 text-right font-mono">
                <div class="flex justify-end items-center gap-1.5">
                  <button
                    type="button"
                    @click="openEditModal(job)"
                    class="px-2 py-1 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 border-none rounded-lg text-xs transition-all cursor-pointer"
                    title="Modifica"
                  >
                    Modifica
                  </button>
                  <a
                    :href="job.applyUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-2 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg text-xs transition-all no-underline"
                    title="Apri Link Candidatura"
                  >
                    Link
                  </a>
                  <button
                    type="button"
                    @click="deleteJob(job.id!)"
                    class="px-2 py-1 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-xs transition-all cursor-pointer"
                    title="Elimina Annuncio"
                  >
                    Elimina
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredJobs.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-500 font-mono text-xs">
                Nessun annuncio di lavoro trovato con i filtri selezionati.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODAL CREAZIONE / MODIFICA -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" @click.self="showModal = false">
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden">
          <div class="flex justify-between items-center border-b border-dkp-border pb-3">
            <h3 class="text-white font-bold text-base m-0">
              {{ isEditing ? 'Modifica Offerta di Lavoro' : 'Crea Nuovo Annuncio Tech' }}
            </h3>
            <button type="button" @click="showModal = false" class="bg-transparent border-none text-slate-500 hover:text-white font-bold text-lg cursor-pointer"></button>
          </div>

          <div class="flex flex-col gap-4 overflow-y-auto pr-1 font-mono text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Titolo Posizione *</label>
                <input
                  v-model="currentJob.title"
                  type="text"
                  placeholder="es. Senior Frontend Developer"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 box-border"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Nome Azienda *</label>
                <input
                  v-model="currentJob.company"
                  type="text"
                  placeholder="es. Pulse Tech Inc."
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 box-border"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Tipologia Lavoro</label>
                <select
                  v-model="currentJob.type"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="remote">Full Remote</option>
                  <option value="hybrid">Ibrido</option>
                  <option value="onsite">In Sede</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Sede / Fuso Orario</label>
                <input
                  v-model="currentJob.location"
                  type="text"
                  placeholder="es. Remote (Worldwide) o Milano"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 box-border"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Stack Tecnologico / Tag (separati da virgola)</label>
              <input
                v-model="currentJob.tags"
                type="text"
                placeholder="es. Vue.js, Nuxt 3, TypeScript, Tailwind"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 box-border"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Range Salariale (Opzionale)</label>
                <input
                  v-model="currentJob.salary"
                  type="text"
                  placeholder="es. €50k - €70k / anno"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 box-border"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">URL Candidatura *</label>
                <input
                  v-model="currentJob.applyUrl"
                  type="url"
                  placeholder="https://company.com/apply"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 box-border"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">Descrizione Breve Posizione</label>
              <textarea
                v-model="currentJob.description"
                rows="3"
                placeholder="Descrivi i requisiti principali e i benefit dell'opportunità..."
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 box-border"
              ></textarea>
            </div>

            <div class="flex flex-col gap-2 pt-2 border-t border-dkp-border">
              <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                <input v-model="currentJob.isFeatured" type="checkbox" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
                <span>Metti l'annuncio In Evidenza (Featured)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                <input v-model="currentJob.isActive" type="checkbox" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
                <span>Pubblica Immediatamente su DKP Platform</span>
              </label>
            </div>
          </div>

          <div class="border-t border-dkp-border pt-4 flex justify-end gap-3 font-mono">
            <button type="button" @click="showModal = false" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border-none rounded-xl text-xs font-bold cursor-pointer">
              Annulla
            </button>
            <button type="button" @click="saveJob" :disabled="isLoading" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold rounded-xl text-xs cursor-pointer disabled:opacity-50">
              {{ isEditing ? 'Aggiorna Annuncio' : 'Pubblica Job' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>