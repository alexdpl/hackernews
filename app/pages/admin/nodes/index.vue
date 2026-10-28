<!-- app/pages/admin/nodes/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'DKP Nodes & Forum Control Center - DKP Admin',
  description: 'Gestione Nodi, Subreddits, moderazione discussioni e verifica audit Sentinel AI Vault.'
})

const { getMainUrl, getApiUrl } = useDomain()

// --- INTERFACCE DATI ---
interface DkpNode {
  id: number | string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  subscribersCount: number
  postsCount?: number
  isPrivate: boolean
  createdAt?: string
}

interface ThreadPost {
  id: number
  title: string
  content: string
  karmaScore: number
  commentsCount: number
  vaultHash?: string
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  nodeId: number
  nodeName: string
  nodeSlug: string
  nodeIcon: string
  nodeColor: string
  authorName: string
}

// --- STATI GLOBALI ---
const nodes = ref<DkpNode[]>([])
const threads = ref<ThreadPost[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const searchQuery = ref('')
const selectedNodeFilter = ref<string>('')
const activeTab = ref<'all' | 'flagged'>('all')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

// --- STATO MODALE NODO ---
const isNodeModalOpen = ref(false)
const nodeForm = ref({
  id: null as number | string | null,
  name: '',
  slug: '',
  description: '',
  icon: '💬',
  color: '#38bdf8',
  isPrivate: false
})

// --- STATO MODALE VAULT REPORT ---
const isVaultModalOpen = ref(false)
const selectedPostForVault = ref<ThreadPost | null>(null)

// Emojis e Colori Preset per i Nodi
const presetEmojis = ['💬', '💻', '⚙️', '⚡', '🧠', '🛡️', '🔒', '🤖', '☁️', '🐳', '🌐', '📦', '🚀', '📱', '🔑', '📊', '🎯', '🛠️', '🔥', '✨']
const presetColors = ['#38bdf8', '#00dc82', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

const autoSlug = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
const handleNodeNameInput = () => { if (!nodeForm.value.id) nodeForm.value.slug = autoSlug(nodeForm.value.name) }

// --- CARICAMENTO DATI ---
const fetchNodes = async () => {
  try {
    const res: any = await $fetch('/api/admin/nodes')
    if (res?.success) nodes.value = res.data || []
  } catch (err: any) {
    console.error('Errore fetch nodi:', err)
    triggerToast('Impossibile caricare i Nodi dal DB.')
  }
}

const fetchThreads = async () => {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/nodes/posts')
    if (res?.success) threads.value = res.data || []
  } catch (err: any) {
    console.error('Errore fetch thread:', err)
    triggerToast('Impossibile caricare le discussioni.')
  } finally {
    isLoading.value = false
  }
}

// --- COMPUTED THREAD FILTRATI ---
const filteredThreads = computed(() => {
  return threads.value.filter(t => {
    const matchesSearch = !searchQuery.value || t.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || t.authorName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesNode = !selectedNodeFilter.value || t.nodeSlug === selectedNodeFilter.value
    const matchesTab = activeTab.value === 'all' ? true : t.isLocked
    return matchesSearch && matchesNode && matchesTab
  })
})

const flaggedCount = computed(() => threads.value.filter(t => t.isLocked).length)

// --- OPERAZIONI NODI ---
const openNodeModal = (node: DkpNode | null = null) => {
  if (node) {
    nodeForm.value = { id: node.id, name: node.name, slug: node.slug, description: node.description, icon: node.icon || '💬', color: node.color || '#38bdf8', isPrivate: node.isPrivate }
  } else {
    nodeForm.value = { id: null, name: '', slug: '', description: '', icon: '💬', color: '#38bdf8', isPrivate: false }
  }
  isNodeModalOpen.value = true
}

const saveNode = async () => {
  if (!nodeForm.value.name || !nodeForm.value.slug || !nodeForm.value.description) {
    return triggerToast('Compila Nome, Slug e Descrizione.')
  }
  isLoading.value = true
  try {
    const payload = { ...nodeForm.value }
    const url = nodeForm.value.id ? `/api/admin/nodes/${nodeForm.value.id}` : '/api/admin/nodes'
    const method = nodeForm.value.id ? 'PUT' : 'POST'

    const res: any = await $fetch(url, { method, body: payload })
    if (res?.success) {
      triggerToast(nodeForm.value.id ? '✅ Nodo aggiornato' : '🚀 Nuovo Nodo creato!')
      await fetchNodes()
      isNodeModalOpen.value = false
    }
  } catch (err: any) {
    triggerToast(`❌ Errore salvataggio nodo: ${err.message || 'DB Error'}`)
  } finally {
    isLoading.value = false
  }
}

const deleteNode = async (id: number | string) => {
  if (!confirm('⚠️ Sei sicuro di voler eliminare questo Nodo? Tutti i thread e commenti associati verranno cancellati.')) return
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/nodes/${id}`, { method: 'DELETE' })
    if (res?.success) {
      triggerToast('🗑️ Nodo eliminato con successo.')
      await fetchNodes()
      await fetchThreads()
    }
  } catch (err: any) {
    triggerToast('❌ Errore durante l eliminazione del nodo.')
  } finally {
    isLoading.value = false
  }
}

// --- AZIONI MODERAZIONE THREAD ---
const togglePinThread = async (post: ThreadPost) => {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_pin' }
    })
    if (res?.success) {
      post.isPinned = !post.isPinned
      triggerToast(post.isPinned ? '📌 Thread fissato in cima' : '📌 Thread sfissato')
    }
  } catch (err) {
    triggerToast('Errore cambio stato Pin.')
  }
}

const toggleLockThread = async (post: ThreadPost) => {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_lock' }
    })
    if (res?.success) {
      post.isLocked = !post.isLocked
      triggerToast(post.isLocked ? '🔒 Thread bloccato (Sentinel AI)' : '🔓 Thread sbloccato')
    }
  } catch (err) {
    triggerToast('Errore cambio stato Lock.')
  }
}

const deleteThread = async (id: number) => {
  if (!confirm('⚠️ Eliminare definitivamente questo Thread? Non potrà essere recuperato.')) return
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${id}`, { method: 'DELETE' })
    if (res?.success) {
      threads.value = threads.value.filter(t => t.id !== id)
      triggerToast('🗑️ Thread rimosso dal database.')
    }
  } catch (err) {
    triggerToast('Errore durante l eliminazione del thread.')
  }
}

const inspectVault = (post: ThreadPost) => {
  selectedPostForVault.value = post
  isVaultModalOpen.value = true
}

onMounted(() => {
  fetchNodes()
  fetchThreads()
})
</script>

<template>
  <div class="admin-page-container">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- NAVBAR GRID ADMIN UNIFICATA -->
    <div class="admin-nav-container">
      <div class="admin-nav-top">
        <div class="nav-branding">
          <span class="status-dot green"></span>
          <span class="nav-title">DKP NODES ADMIN CONTROL CENTER</span>
        </div>
        <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <!-- GRID MODULI ADMIN -->
      <nav class="admin-grid-nav">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" class="nav-tab btn-dashboard">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/crawler')" class="nav-tab btn-dashboard">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" class="nav-tab btn-dashboard">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/nodes')" class="nav-tab btn-dashboard active">💬 Gestione Nodi</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" class="nav-tab btn-dashboard">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" class="nav-tab btn-dashboard">💼 Gestione Jobs</NuxtLink>
      </nav>
    </div>

    <!-- HEADER HERO -->
    <header class="header-section">
      <div class="badge">
        <span class="badge-dot"></span>
        DKP NODES &amp; SUBREDDITS CONTROL CENTER
      </div>
      <h1>Gestione <span class="highlight">DKP Nodes &amp; Moderazione</span></h1>
      <p class="subtitle">
        Crea e gestisci i Nodi della community, modera le discussioni ed esamina la coda di audit Sentinel AI.
      </p>
    </header>

    <!-- MAIN HYBRID GRID (380px / 1fr) -->
    <div class="hybrid-grid">
      
      <!-- ================= COLONNA SINISTRA: NODI (SUBREDDITS) ================= -->
      <aside class="sidebar-panel">
        <div class="sidebar-header">
          <h3 class="flex items-center gap-2">
            🏷️ Nodi Attivi ({{ nodes.length }})
          </h3>
          <button @click="openNodeModal()" class="btn-primary btn-sm">
            ➕ Nuovo
          </button>
        </div>

        <div v-if="!nodes.length" class="empty-state">
          Nessun nodo registrato. Creane uno nuovo!
        </div>

        <div v-else class="compact-cat-list">
          <div v-for="node in nodes" :key="node.id" class="compact-cat-item">
            <div class="cat-item-top">
              <div class="cat-info-head">
                <div class="cat-icon-badge mini" :style="{ backgroundColor: `${node.color || '#38bdf8'}20`, color: node.color || '#38bdf8', borderColor: `${node.color || '#38bdf8'}40` }">
                  <span class="text-base">{{ node.icon || '💬' }}</span>
                </div>
                <div>
                  <h4 class="cat-title-sm">n/{{ node.name }}</h4>
                  <span class="cat-slug-sm">/nodes/n/{{ node.slug }}</span>
                </div>
              </div>
              <div class="actions">
                <button @click="openNodeModal(node)" class="btn-icon" title="Modifica Nodo">✏️</button>
                <button @click="deleteNode(node.id)" class="btn-icon danger" title="Elimina Nodo">🗑️</button>
              </div>
            </div>
            
            <p class="text-[11px] text-slate-400 mt-1 mb-2 line-clamp-2">{{ node.description }}</p>

            <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              <span>👥 {{ node.subscribersCount }} Iscritti</span>
              <span>💬 {{ node.postsCount || 0 }} Thread</span>
              <span v-if="node.isPrivate" class="text-amber-400 font-bold">🔒 Privato</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- ================= COLONNA DESTRA: THREADS & MODERAZIONE ================= -->
      <main class="main-panel">
        <div class="card table-card">
          
          <!-- CONTROLLI TAB & FILTRI -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <button 
                @click="activeTab = 'all'" 
                :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all', activeTab === 'all' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white']"
              >
                Tutti i Thread ({{ threads.length }})
              </button>
              <button 
                @click="activeTab = 'flagged'" 
                :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5', activeTab === 'flagged' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white']"
              >
                <span>🛡️ Coda Sentinel AI</span>
                <span v-if="flaggedCount > 0" class="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold">
                  {{ flaggedCount }}
                </span>
              </button>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <select v-model="selectedNodeFilter" class="dkp-input text-xs py-1.5">
                <option value="">Tutti i Nodi</option>
                <option v-for="n in nodes" :key="n.id" :value="n.slug">n/{{ n.name }}</option>
              </select>
              <input v-model="searchQuery" type="text" placeholder="Cerca thread o autore..." class="dkp-input text-xs py-1.5" />
            </div>
          </div>

          <!-- TABELLA DISCUSSIONI -->
          <div v-if="isLoading" class="text-center py-10 text-sky-400 animate-pulse font-mono">
            Sincronizzazione discussioni con Neon DB...
          </div>

          <div v-else class="table-responsive">
            <table class="dkp-table">
              <thead>
                <tr>
                  <th>TITOLO DISCUSSIONE</th>
                  <th>NODO</th>
                  <th>AUTORE</th>
                  <th>KARMA</th>
                  <th>STATO</th>
                  <th style="text-align: right;">AZIONI MODERAZIONE</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="post in filteredThreads" :key="post.id" :class="{ 'pending-row': post.isLocked }">
                  <td class="font-bold">
                    <NuxtLink :to="`/nodes/thread/${post.id}`" target="_blank" class="hover:text-sky-400">
                      {{ post.title }}
                    </NuxtLink>
                    <span v-if="post.vaultHash" class="ml-2 text-[10px] text-purple-400 font-mono" title="Vault Proof-of-Code Certificato">🛡️ Proof-of-Code</span>
                  </td>
                  <td>
                    <span class="cat-badge" :style="{ color: post.nodeColor || '#38bdf8' }">
                      {{ post.nodeIcon }} n/{{ post.nodeSlug }}
                    </span>
                  </td>
                  <td class="date-text">@{{ post.authorName }}</td>
                  <td class="font-mono font-bold" :class="post.karmaScore > 0 ? 'text-emerald-400' : 'text-slate-400'">
                    ▲ {{ post.karmaScore }}
                  </td>
                  <td>
                    <span v-if="post.isPinned" class="status-badge success mr-1">📌 Pinned</span>
                    <span v-if="post.isLocked" class="status-badge warning">🔒 Locked (Sentinel)</span>
                    <span v-if="!post.isPinned && !post.isLocked" class="status-badge draft">Attivo</span>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button v-if="post.vaultHash" @click="inspectVault(post)" class="btn-icon text-purple-400" title="Ispeziona Proof-of-Code Vault">🛡️</button>
                      <button @click="togglePinThread(post)" class="btn-icon" :title="post.isPinned ? 'Unpin' : 'Pin in Cima'">📌</button>
                      <button @click="toggleLockThread(post)" class="btn-icon" :title="post.isLocked ? 'Sblocca Discussione' : 'Blocca Discussione'">🔒</button>
                      <button @click="deleteThread(post.id)" class="btn-icon btn-delete" title="Elimina Thread">🗑️</button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredThreads.length === 0">
                  <td colspan="6" style="text-align: center; padding: 2rem; color: #888;">
                    📂 Nessun thread trovato per i filtri selezionati.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>

    <!-- MODALE CREAZIONE / MODIFICA NODO -->
    <div v-if="isNodeModalOpen" class="modal-backdrop" @click.self="isNodeModalOpen = false">
      <div class="modal-box">
        <div class="vault-modal-header">
          <h3>💬 {{ nodeForm.id ? "Modifica Nodo" : "Nuovo Nodo (Subreddit)" }}</h3>
          <button class="icon-btn" @click="isNodeModalOpen = false">×</button>
        </div>

        <div class="form-stack mt-4">
          <div class="form-group">
            <label>NOME NODO *</label>
            <input v-model="nodeForm.name" @input="handleNodeNameInput" type="text" placeholder="Es. devops, javascript, rust" required />
          </div>

          <div class="form-group">
            <label>URL SLUG *</label>
            <input v-model="nodeForm.slug" type="text" placeholder="devops" required />
          </div>

          <div class="form-group">
            <label>DESCRIZIONE NODO *</label>
            <textarea v-model="nodeForm.description" rows="2" placeholder="Di cosa si parla in questo nodo..." required></textarea>
          </div>

          <div class="form-group">
            <label>SELEZIONA ICONA EMOJI</label>
            <div class="icons-grid emoji-scroll-picker">
              <button v-for="emoji in presetEmojis" :key="emoji" type="button" @click="nodeForm.icon = emoji" :class="['icon-btn', { active: nodeForm.icon === emoji }]">
                {{ emoji }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>COLORE ACCENT NODO</label>
            <div class="color-picker">
              <span v-for="color in presetColors" :key="color" @click="nodeForm.color = color" :style="{ backgroundColor: color }" :class="['color-dot', { active: nodeForm.color === color }]"></span>
              <input v-model="nodeForm.color" type="color" class="color-input" title="Colore personalizzato" />
            </div>
          </div>

          <div class="badge-preview-box">
            <span class="preview-label">Anteprima Live:</span>
            <span class="preview-badge" :style="{ backgroundColor: `${nodeForm.color}20`, color: nodeForm.color, borderColor: `${nodeForm.color}40` }">
              <span>{{ nodeForm.icon }}</span> n/{{ nodeForm.name || "nome-nodo" }}
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveNode" class="btn-primary btn-save-cat" :disabled="isLoading">💾 Salva Nodo</button>
          <button @click="isNodeModalOpen = false" class="btn-cancel">Annulla</button>
        </div>
      </div>
    </div>

    <!-- MODALE VAULT PROOF OF CODE -->
    <div v-if="isVaultModalOpen && selectedPostForVault" class="modal-backdrop" @click.self="isVaultModalOpen = false">
      <div class="modal-box vault-report-modal">
        <div class="vault-modal-header">
          <h3>🛡️ DKP Vault Proof-of-Code Certificate</h3>
          <span class="vault-cert-tag">NODES SENTINEL AUDIT</span>
        </div>

        <div class="vault-report-content mt-4">
          <h4 class="report-title">{{ selectedPostForVault.title }}</h4>
          <p class="report-sub">Autore: <strong>@{{ selectedPostForVault.authorName }}</strong> • Data: {{ new Date(selectedPostForVault.createdAt).toLocaleDateString('it-IT') }}</p>
          
          <div class="vault-hash-box">
            <span class="hash-label">SHA-256 PROOF-OF-CODE CHECKSUM:</span>
            <code>{{ selectedPostForVault.vaultHash }}</code>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="isVaultModalOpen = false" class="btn-cancel" style="width: 100%;">Chiudi Report</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ==========================================================================
   STILI NAVBAR ADMIN & COMPONENTI UNIFICATI (Identici all'Admin Blog)
   ========================================================================== */
.admin-nav-container { display: flex; flex-direction: column; gap: 12px; background: #090d16; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px; margin-bottom: 20px; }
.admin-nav-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
.nav-branding { display: flex; align-items: center; gap: 8px; }
.status-dot.green { width: 8px; height: 8px; background-color: #00ff87; border-radius: 50%; box-shadow: 0 0 8px #00ff87; }
.nav-title { color: #00f0ff; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.05em; text-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }
.admin-grid-nav { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.nav-tab { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 6px; font-weight: 700; font-size: 0.88rem; text-decoration: none; transition: all 0.2s ease-in-out; cursor: pointer; }
.btn-dashboard { color: #00ff87; background: rgba(0, 255, 135, 0.04); border: 1px solid rgba(0, 255, 135, 0.3); }
.btn-dashboard:hover, .btn-dashboard.active { background: rgba(0, 255, 135, 0.12); border-color: #00ff87; box-shadow: 0 0 12px rgba(0, 255, 135, 0.25); transform: translateY(-1px); }
.btn-dashboard-main { color: #00f0ff; background: rgba(0, 240, 255, 0.06); border: 1px solid rgba(0, 240, 255, 0.4); }

.dkp-toast-success { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 999999; background: #061811; border: 1px solid #00dc82; box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35); padding: 0.9rem 1.3rem; border-radius: 10px; backdrop-filter: blur(16px); max-width: 420px; }
.toast-content { color: #f8fafc; font-family: monospace; font-size: 0.85rem; font-weight: 600; }

.admin-page-container { padding: 2rem; background-color: #020420; min-height: 100vh; color: #f8fafc; font-family: system-ui, sans-serif; max-width: 1280px; margin: 0 auto; }
.header-section { margin-bottom: 2rem; }
.badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(0, 220, 130, 0.12); color: #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(0, 220, 130, 0.3); margin-bottom: 0.75rem; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #00dc82; box-shadow: 0 0 8px #00dc82; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.9rem; margin: 0; }

.hybrid-grid { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; align-items: flex-start; }
@media (max-width: 1024px) { .hybrid-grid { grid-template-columns: 1fr; } .admin-grid-nav { grid-template-columns: repeat(3, 1fr); } }

.sidebar-panel { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff; }

.compact-cat-list { display: flex; flex-direction: column; gap: 0.75rem; }
.compact-cat-item { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 0.85rem; }
.cat-item-top { display: flex; justify-content: space-between; align-items: flex-start; }
.cat-info-head { display: flex; align-items: center; gap: 0.6rem; }
.cat-title-sm { margin: 0; font-size: 0.95rem; color: #fff; font-weight: 700; }
.cat-slug-sm { font-size: 0.7rem; color: #64748b; font-family: monospace; }
.cat-icon-badge.mini { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; }

.card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
.form-stack { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.dkp-input, .form-group input, .form-group select, .form-group textarea { background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.65rem; border-radius: 8px; outline: none; font-size: 0.875rem; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #00dc82; }

.btn-primary { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
.actions { display: flex; gap: 0.3rem; }
.btn-icon { background: #1e293b; border: none; color: #fff; padding: 0.25rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
.btn-icon.danger:hover { background: rgba(239, 68, 68, 0.2); }

.table-responsive { overflow-x: auto; }
.dkp-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.dkp-table th { background: #020420; color: #64748b; padding: 0.75rem; border-bottom: 1px solid #1e293b; text-transform: uppercase; font-size: 0.7rem; }
.dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.cat-badge { background: rgba(56, 189, 248, 0.12); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
.status-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; }
.status-badge.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.status-badge.draft { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
.action-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 20000; padding: 1rem; }
.modal-box { background: #090d16; border: 1px solid #1e293b; border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 520px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7); }
.vault-modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; }
.vault-modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 900; color: #00f0ff; }
.vault-cert-tag { font-size: 0.65rem; font-weight: 900; background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; }
.report-title { font-size: 1.1rem; font-weight: 800; color: #ffffff; margin: 0 0 4px 0; }
.report-sub { font-size: 0.8rem; color: #94a3b8; margin: 0 0 16px 0; }
.vault-hash-box { background: #020420; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; }
.hash-label { font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
.vault-hash-box code { color: #00ff87; font-family: monospace; font-size: 0.75rem; word-break: break-all; }
.modal-footer { flex-shrink: 0; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; gap: 12px; }
.emoji-scroll-picker { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.4rem; max-height: 110px; overflow-y: auto; padding: 0.5rem; background: #020420; border: 1px solid #1e293b; border-radius: 8px; }
.icon-btn { background: #090d16; border: 1px solid #1e293b; font-size: 1.2rem; padding: 0.4rem; border-radius: 6px; cursor: pointer; color: #fff; }
.icon-btn:hover, .icon-btn.active { border-color: #00dc82; background: rgba(0, 220, 130, 0.15); }
.color-picker { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
.color-dot.active { border-color: #ffffff; transform: scale(1.1); }
.color-input { width: 32px; height: 32px; padding: 0; border: none; background: none; cursor: pointer; }
.badge-preview-box { display: flex; align-items: center; gap: 0.75rem; background: #020420; padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid #1e293b; }
.preview-label { font-size: 0.75rem; color: #64748b; font-weight: 700; }
.preview-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.8rem; font-weight: 800; border: 1px solid; }
.btn-save-cat { background: #00dc82; color: #020420; font-weight: 900; padding: 0.6rem 1.2rem; border-radius: 6px; border: none; cursor: pointer; }
.btn-cancel { background: #1e293b; color: #cbd5e1; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 700; }
</style>