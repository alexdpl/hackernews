<!-- app/pages/admin/mail/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  title: 'DKP Mail Engine Admin | DevKernelPulse',
})

interface MailMessage {
  id: number
  sender: string
  recipient: string
  subject: string
  body_text?: string
  body_html?: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'UNREAD' | 'READ' | 'ARCHIVED' | 'SENT' | 'FAILED'
  is_starred: boolean
  reply_to_id?: number
  created_at: string
}

// State
const mails = ref<MailMessage[]>([])
const unreadCount = ref<number>(0)
const isLoading = ref<boolean>(true)
const selectedFilter = ref<'ALL' | 'INBOUND' | 'OUTBOUND' | 'STARRED'>('ALL')
const searchQuery = ref<string>('')
const activeMail = ref<MailMessage | null>(null)

// Modal Composer State
const showComposeModal = ref<boolean>(false)
const isSending = ref<boolean>(false)
const sendSuccessMsg = ref<string>('')
const sendErrorMsg = ref<string>('')

const composeData = ref({
  from: 'info@devkernelpulse.org',
  to: '',
  subject: '',
  html: '',
  replyToId: null as number | null
})

// Fetch Mails from Backend
async function fetchMails() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/mail')
    if (res && res.success) {
      mails.value = res.mails || []
      unreadCount.value = res.unreadCount || 0
      if (mails.value.length > 0 && !activeMail.value) {
        activeMail.value = mails.value[0]
      }
    }
  } catch (err) {
    console.error('[FETCH MAILS ERROR]', err)
  } finally {
    isLoading.value = false
  }
}

// Computed Filtered Mails
const filteredMails = computed(() => {
  return mails.value.filter(m => {
    // Filter type
    if (selectedFilter.value === 'INBOUND' && m.direction !== 'INBOUND') return false
    if (selectedFilter.value === 'OUTBOUND' && m.direction !== 'OUTBOUND') return false
    if (selectedFilter.value === 'STARRED' && !m.is_starred) return false

    // Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchSender = m.sender.toLowerCase().includes(q)
      const matchRecipient = m.recipient.toLowerCase().includes(q)
      const matchSubject = m.subject.toLowerCase().includes(q)
      return matchSender || matchRecipient || matchSubject
    }

    return true
  })
})

function selectMail(mail: MailMessage) {
  activeMail.value = mail
  if (mail.status === 'UNREAD') {
    mail.status = 'READ'
    if (unreadCount.value > 0) unreadCount.value--
  }
}

function openReply(mail: MailMessage) {
  composeData.value = {
    from: mail.recipient.includes('@devkernelpulse.org') ? mail.recipient : 'info@devkernelpulse.org',
    to: mail.sender,
    subject: mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
    html: '',
    replyToId: mail.id
  }
  showComposeModal.value = true
}

async function handleSendMail() {
  sendSuccessMsg.value = ''
  sendErrorMsg.value = ''
  isSending.value = true

  try {
    const res: any = await $fetch('/api/admin/mail/send', {
      method: 'POST',
      body: composeData.value
    })

    if (res && res.success) {
      sendSuccessMsg.value = '⚡ Email inviata con successo!'
      setTimeout(() => {
        showComposeModal.value = false
        sendSuccessMsg.value = ''
        composeData.value = { from: 'info@devkernelpulse.org', to: '', subject: '', html: '', replyToId: null }
        fetchMails()
      }, 1200)
    } else {
      sendErrorMsg.value = res.error || 'Errore durante l\'invio dell\'email.'
    }
  } catch (err: any) {
    sendErrorMsg.value = err.message || 'Errore di connessione al server mail.'
  } finally {
    isSending.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchMails()
})
</script>

<template>
  <div class="mail-admin-container">
  <!-- TOP BAR DI NAVIGAZIONE ADMIN -->
<div class="admin-top-bar">
  <div class="admin-breadcrumb">
    <span class="status-dot green"></span>
    <span class="breadcrumb-text">ADMIN CONTROL CENTER</span>
  </div>

  <NuxtLink to="/admin" class="btn-back-dashboard">
    📊 Torna alla Dashboard
  </NuxtLink>
</div>
    <!-- TOP HEADER TOOLBAR -->
    <header class="mail-header-bar">
      <div class="header-left">
        <h1 class="page-title">
          ⚡ DKP Mail Engine <span class="badge-v">v2.4</span>
        </h1>
        <p class="page-subtitle">Client Webmail & Mail Ecosystem Control Center</p>
      </div>

      <div class="header-actions">
        <div class="stat-card">
          <span class="stat-num text-neon">{{ unreadCount }}</span>
          <span class="stat-label">Non Lette</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ mails.length }}</span>
          <span class="stat-label">Totali In-DB</span>
        </div>

        <button @click="fetchMails" class="btn-secondary" title="Aggiorna Posta">
          🔄 Ricarica
        </button>

        <button @click="showComposeModal = true" class="btn-primary">
          ✏️ Nuova Email
        </button>
      </div>
    </header>

    <!-- MAIN MAIL DASHBOARD WORKSPACE -->
    <div class="mail-workspace">
      <!-- SIDEBAR FILTRI & NAVIGAZIONE STRUMENTI -->
      <aside class="mail-sidebar">
        <nav class="sidebar-nav">
          <button 
            @click="selectedFilter = 'ALL'" 
            class="nav-item" 
            :class="{ active: selectedFilter === 'ALL' }"
          >
            📥 Tutti i Messaggi
            <span class="count-badge">{{ mails.length }}</span>
          </button>

          <button 
            @click="selectedFilter = 'INBOUND'" 
            class="nav-item" 
            :class="{ active: selectedFilter === 'INBOUND' }"
          >
            📬 In Arrivo
            <span v-if="unreadCount > 0" class="count-badge neon">{{ unreadCount }}</span>
          </button>

          <button 
            @click="selectedFilter = 'OUTBOUND'" 
            class="nav-item" 
            :class="{ active: selectedFilter === 'OUTBOUND' }"
          >
            📤 Inviati
          </button>

          <button 
            @click="selectedFilter = 'STARRED'" 
            class="nav-item" 
            :class="{ active: selectedFilter === 'STARRED' }"
          >
            ⭐ Preferiti
          </button>

          <div class="sidebar-divider"></div>
          <span class="sidebar-section-title">STRUMENTI MAIL</span>

          <!-- LINK INTERNI ROUTING NUXT -->
          <NuxtLink to="/admin/newsletter" class="nav-item link-item">
            📡 Newsletter & Contatti
          </NuxtLink>

          <NuxtLink to="/admin/autoresponder" class="nav-item link-item">
            🤖 Autoresponder Rules
          </NuxtLink>
        </nav>

        <div class="sidebar-divider"></div>

        <div class="quick-addresses-box">
          <span class="box-title">INDIRIZZI ATTIVI CLOUDFLARE</span>
          <ul class="address-list">
            <li><span class="status-dot"></span> admin@devkernelpulse.org</li>
			<li><span class="status-dot"></span> info@devkernelpulse.org</li>
            <li><span class="status-dot"></span> support@devkernelpulse.org</li>
            <li><span class="status-dot"></span> newsletter@devkernelpulse.org</li>
			<li><span class="status-dot"></span> noreply@devkernelpulse.org</li>
            <li><span class="status-dot"></span> alex@devkernelpulse.org</li>
          </ul>
        </div>
      </aside>

      <!-- PANNELLO LISTA EMAIL -->
      <div class="mail-list-panel">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Cerca per mittente, destinatario o oggetto..." 
            class="search-input"
          />
        </div>

        <div v-if="isLoading" class="loading-state">
          ⚡ Caricamento messaggi dal Kernel DB...
        </div>

        <div v-else-if="filteredMails.length === 0" class="empty-state">
          📭 Nessun messaggio trovato.
        </div>

        <div v-else class="mail-items-scroll">
          <div 
            v-for="m in filteredMails" 
            :key="m.id" 
            class="mail-card"
            :class="{ 
              active: activeMail?.id === m.id, 
              unread: m.status === 'UNREAD',
              outbound: m.direction === 'OUTBOUND'
            }"
            @click="selectMail(m)"
          >
            <div class="mail-card-header">
              <span class="sender-tag">
                {{ m.direction === 'OUTBOUND' ? 'A: ' + m.recipient : 'Da: ' + m.sender }}
              </span>
              <span class="mail-date">{{ formatDate(m.created_at) }}</span>
            </div>

            <div class="mail-subject">{{ m.subject }}</div>

            <div class="mail-preview">
              {{ m.body_text || 'Messaggio HTML senza anteprima testo' }}
            </div>

            <div class="mail-card-footer">
              <span class="dir-badge" :class="m.direction.toLowerCase()">
                {{ m.direction }}
              </span>
              <span class="status-tag" :class="m.status.toLowerCase()">
                {{ m.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- PANNELLO DETTAGLIO EMAIL -->
      <main class="mail-detail-panel">
        <div v-if="!activeMail" class="no-mail-selected">
          📩 Seleziona un'email dalla lista per visualizzarne il contenuto
        </div>

        <div v-else class="mail-reader">
          <!-- READER HEADER -->
          <div class="reader-header">
            <div class="reader-title-row">
              <h2 class="reader-subject">{{ activeMail.subject }}</h2>
              <button @click="openReply(activeMail)" class="btn-primary btn-sm">
                ↩️ Rispondi
              </button>
            </div>

            <div class="reader-meta">
              <div class="meta-line">
                <span class="meta-label">Da:</span> <strong>{{ activeMail.sender }}</strong>
              </div>
              <div class="meta-line">
                <span class="meta-label">A:</span> <strong>{{ activeMail.recipient }}</strong>
              </div>
              <div class="meta-line">
                <span class="meta-label">Data:</span> {{ formatDate(activeMail.created_at) }}
              </div>
            </div>
          </div>

          <!-- READER BODY -->
          <div class="reader-body">
            <div 
              v-if="activeMail.body_html" 
              class="html-content-view" 
              v-html="activeMail.body_html"
            ></div>
            <div v-else class="text-content-view">
              {{ activeMail.body_text || 'Nessun contenuto nel corpo della mail.' }}
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL COMPOSE EMAIL -->
    <Transition name="modal-fade">
      <div v-if="showComposeModal" class="modal-backdrop" @click.self="showComposeModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>✏️ Nuova Email Outbound — DKP Engine</h3>
            <button @click="showComposeModal = false" class="btn-close">✕</button>
          </div>

          <form @submit.prevent="handleSendMail" class="modal-form">
            <div class="form-group">
              <label>Da (Mittente Custom):</label>
              <select v-model="composeData.from" class="form-input">
			  <option value="admin@devkernelpulse.org">admin@devkernelpulse.org</option>
                <option value="info@devkernelpulse.org">info@devkernelpulse.org</option>
                <option value="support@devkernelpulse.org">support@devkernelpulse.org</option>
                <option value="newsletter@devkernelpulse.org">newsletter@devkernelpulse.org</option>
				<option value="noreply@devkernelpulse.org">noreply@devkernelpulse.org</option>
                <option value="alex@devkernelpulse.org">alex@devkernelpulse.org</option>
              </select>
            </div>

            <div class="form-group">
              <label>A (Destinatario):</label>
              <input 
                v-model="composeData.to" 
                type="email" 
                required 
                placeholder="es. utente@gmail.com" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Oggetto:</label>
              <input 
                v-model="composeData.subject" 
                type="text" 
                required 
                placeholder="Inserisci l'oggetto della mail" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Corpo del Messaggio (HTML supportato):</label>
              <textarea 
                v-model="composeData.html" 
                rows="8" 
                required 
                placeholder="Scrivi qui il tuo messaggio in formato HTML o Testo semplice..." 
                class="form-input textarea"
              ></textarea>
            </div>

            <div v-if="sendSuccessMsg" class="alert success">{{ sendSuccessMsg }}</div>
            <div v-if="sendErrorMsg" class="alert error">{{ sendErrorMsg }}</div>

            <div class="modal-footer">
              <button type="button" @click="showComposeModal = false" class="btn-secondary">
                Annulla
              </button>
              <button type="submit" :disabled="isSending" class="btn-primary">
                {{ isSending ? '⚡ Invio in corso...' : '🚀 Invia Email' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>


/* ==========================================================================
   TOP BAR NAVIGAZIONE ADMIN (TORNA ALLA DASHBOARD)
   ========================================================================== */
.admin-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
}

.breadcrumb-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

/* BOTTONE NEON TORNA ALLA DASHBOARD */
.btn-back-dashboard {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-back-dashboard:hover {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.08);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.2);
  transform: translateY(-1px);
}

.mail-admin-container {
  padding: 1.5rem;
  background-color: #020420;
  color: #f8fafc;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* HEADER TOOLBAR */
.mail-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1rem 1.5rem;
  border-radius: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-v {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.page-subtitle {
  margin: 0.2rem 0 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #020420;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
}

.stat-num { font-size: 1.1rem; font-weight: 800; }
.text-neon { color: #00dc82; }
.stat-label { font-size: 0.68rem; color: #94a3b8; }

.btn-primary {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover { background: #00bf71; transform: translateY(-1px); }

.btn-secondary {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  border: 1px solid #334155;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background: #334155; }

/* MAIN WORKSPACE 3-COLUMNS */
.mail-workspace {
  display: grid;
  grid-template-columns: 240px 360px 1fr;
  gap: 1rem;
  flex: 1;
  min-height: 600px;
}

/* SIDEBAR */
.mail-sidebar {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-nav { display: flex; flex-direction: column; gap: 0.4rem; }

.sidebar-section-title {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
  padding: 0.2rem 0.5rem;
}

.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  text-align: left;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-item:hover, .nav-item.active, .nav-item.router-link-exact-active {
  background: #020420;
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.2);
}

.link-item {
  color: #cbd5e1;
}

.count-badge {
  background: #1e293b;
  color: #f8fafc;
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: 10px;
}
.count-badge.neon { background: #00dc82; color: #020420; font-weight: 800; }

.sidebar-divider { height: 1px; background: #1e293b; }

.quick-addresses-box { font-size: 0.75rem; }
.box-title { font-weight: 800; color: #64748b; letter-spacing: 0.5px; }
.address-list { list-style: none; padding: 0; margin: 0.5rem 0 0 0; display: flex; flex-direction: column; gap: 0.4rem; color: #94a3b8; }
.status-dot { display: inline-block; width: 6px; height: 6px; background: #00dc82; border-radius: 50%; margin-right: 0.4rem; }

/* LIST PANEL */
.mail-list-panel {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box { padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.search-input {
  width: 100%;
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  outline: none;
}
.search-input:focus { border-color: #00dc82; }

.loading-state, .empty-state { padding: 2rem; text-align: center; color: #64748b; font-size: 0.85rem; }

.mail-items-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

.mail-card {
  padding: 0.85rem;
  border-bottom: 1px solid #1e293b;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.mail-card:hover { background: rgba(255, 255, 255, 0.02); }
.mail-card.active { background: #020420; border-left: 3px solid #00dc82; }
.mail-card.unread { background: rgba(0, 220, 130, 0.04); }

.mail-card-header { display: flex; justify-content: space-between; font-size: 0.75rem; }
.sender-tag { font-weight: 700; color: #f8fafc; }
.mail-date { color: #64748b; }

.mail-subject { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mail-preview { font-size: 0.75rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mail-card-footer { display: flex; gap: 0.4rem; margin-top: 0.2rem; }
.dir-badge { font-size: 0.62rem; font-weight: 800; padding: 0.1rem 0.35rem; border-radius: 4px; text-transform: uppercase; }
.dir-badge.inbound { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.dir-badge.outbound { background: rgba(168, 85, 247, 0.2); color: #c084fc; }

.status-tag { font-size: 0.62rem; padding: 0.1rem 0.35rem; border-radius: 4px; text-transform: uppercase; }
.status-tag.unread { background: rgba(0, 220, 130, 0.2); color: #00dc82; }
.status-tag.read { background: #1e293b; color: #94a3b8; }
.status-tag.sent { background: rgba(16, 185, 129, 0.2); color: #34d399; }

/* DETAIL READER PANEL */
.mail-detail-panel {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.no-mail-selected {
  margin: auto;
  color: #64748b;
  font-size: 0.9rem;
}

.reader-header {
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.reader-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.reader-subject {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #00dc82;
}

.btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }

.reader-meta {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.82rem;
  color: #94a3b8;
}

.meta-label { color: #64748b; width: 45px; display: inline-block; }

.reader-body {
  flex: 1;
  overflow-y: auto;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
  font-size: 0.9rem;
  line-height: 1.6;
}

.html-content-view :deep(a) { color: #00dc82; text-decoration: underline; }
.text-content-view { white-space: pre-wrap; word-break: break-word; }

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  width: 550px;
  max-width: 90vw;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  overflow: hidden;
}

.modal-header {
  padding: 1rem 1.25rem;
  background: #020420;
  border-bottom: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { margin: 0; font-size: 1rem; color: #fff; }
.btn-close { background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; }

.modal-form { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }

.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; }

.form-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}
.form-input:focus { border-color: #00dc82; }
.textarea { resize: vertical; font-family: inherit; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }

.alert { padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.8rem; }
.alert.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.alert.error { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .mail-workspace { grid-template-columns: 1fr; }
  .mail-header-bar { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>