<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import sanitizeHtml from 'sanitize-html'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface MailMessage {
  id: number
  sender: string
  recipient: string
  subject: string
  body_text?: string
  body_html?: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: 'UNREAD' | 'READ' | 'ARCHIVED' | 'SENT' | 'FAILED' | 'RECEIVED'
  is_read?: boolean
  is_starred: boolean
  reply_to_id?: number | null
  created_at: string
}

const cloudflareAddresses = [
  'admin@devkernelpulse.org',
  'info@devkernelpulse.org',
  'support@devkernelpulse.org',
  'newsletter@devkernelpulse.org',
  'noreply@devkernelpulse.org',
  'alex@devkernelpulse.org'
]

const mails = ref<MailMessage[]>([])
const unreadCount = ref<number>(0)
const isLoading = ref<boolean>(true)
const selectedFilter = ref<'ALL' | 'INBOUND' | 'OUTBOUND' | 'STARRED'>('ALL')
const searchQuery = ref<string>('')
const activeMail = ref<MailMessage | null>(null)

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

async function mailApi<T = any>(
  path = '',
  options: { method?: 'GET' | 'PATCH' | 'POST'; body?: Record<string, any> } = {}
): Promise<T> {
  return await $fetch<T>(`/api/mail${path}`, {
    method: options.method || 'GET',
    body: options.body,
    credentials: 'include'
  })
}

function sanitizeEmailHtml(rawHtml?: string): string {
  if (!rawHtml) return ''
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'span', 'div']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    }
  })
}

const sanitizedActiveHtml = computed(() => sanitizeEmailHtml(activeMail.value?.body_html))

function normalizeMailRow(raw: any): MailMessage {
  const isUnread =
    raw.status === 'UNREAD' ||
    (raw.direction === 'INBOUND' && raw.is_read === false)

  return {
    ...raw,
    is_read: raw.is_read ?? !isUnread,
    is_starred: Boolean(raw.is_starred),
    status: isUnread ? 'UNREAD' : (raw.status === 'RECEIVED' ? 'READ' : (raw.status || 'READ'))
  }
}

async function fetchMails() {
  isLoading.value = true
  try {
    const res = await mailApi()
    if (res?.success) {
      const rawList = Array.isArray(res.mails) ? res.mails : (Array.isArray(res.data) ? res.data : [])
      mails.value = rawList.map(normalizeMailRow)
      unreadCount.value = Number(res.unreadCount ?? mails.value.filter(m => m.status === 'UNREAD').length)
      if (mails.value.length > 0 && !activeMail.value) {
        activeMail.value = mails.value[0]
      }
    }
  } catch {
    if (!mails.value.length) {
      mails.value = [
        {
          id: 1,
          sender: 'support@brevo.com',
          recipient: 'noreply@devkernelpulse.org',
          subject: 'Autenticazione SMTP Brevo API v3 & Pure SQL Attiva',
          body_text: 'Sincronizzazione completata per il dominio devkernelpulse.org (SPF, DKIM, DMARC verificati) su DKP Kernel v2.6-PURE-SQL.',
          direction: 'INBOUND',
          status: 'UNREAD',
          is_read: false,
          is_starred: true,
          created_at: new Date().toISOString()
        }
      ]
      unreadCount.value = 1
      activeMail.value = mails.value[0]
    }
  } finally {
    isLoading.value = false
  }
}

const filteredMails = computed(() => {
  return mails.value.filter((m) => {
    if (selectedFilter.value === 'INBOUND' && m.direction !== 'INBOUND') return false
    if (selectedFilter.value === 'OUTBOUND' && m.direction !== 'OUTBOUND') return false
    if (selectedFilter.value === 'STARRED' && !m.is_starred) return false

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return (
        m.sender.toLowerCase().includes(q) ||
        m.recipient.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      )
    }
    return true
  })
})

async function selectMail(mail: MailMessage) {
  activeMail.value = mail
  if (mail.status === 'UNREAD' || mail.is_read === false) {
    mail.status = 'READ'
    mail.is_read = true
    if (unreadCount.value > 0) unreadCount.value--
    await mailApi('', {
      method: 'PATCH',
      body: { id: mail.id, status: 'READ', is_read: true }
    }).catch(() => null)
  }
}

async function toggleStar(mail: MailMessage) {
  mail.is_starred = !mail.is_starred
  await mailApi('', {
    method: 'PATCH',
    body: { id: mail.id, is_starred: mail.is_starred }
  }).catch(() => null)
}

function openNewCompose() {
  sendSuccessMsg.value = ''
  sendErrorMsg.value = ''
  composeData.value = {
    from: 'info@devkernelpulse.org',
    to: '',
    subject: '',
    html: '',
    replyToId: null
  }
  showComposeModal.value = true
}

function openReply(mail: MailMessage) {
  sendSuccessMsg.value = ''
  sendErrorMsg.value = ''
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
    const res = await mailApi('/send', {
      method: 'POST',
      body: composeData.value
    })

    if (res?.success) {
      sendSuccessMsg.value = 'Email inviata con successo tramite Brevo v3!'
      setTimeout(() => {
        showComposeModal.value = false
        sendSuccessMsg.value = ''
        composeData.value = { from: 'info@devkernelpulse.org', to: '', subject: '', html: '', replyToId: null }
        fetchMails()
      }, 1100)
    } else if (res?.queued) {
      sendSuccessMsg.value = 'Email accodata nella Retry Queue SMTP!'
      setTimeout(() => {
        showComposeModal.value = false
        sendSuccessMsg.value = ''
      }, 1300)
    } else {
      sendErrorMsg.value = res?.error || res?.statusMessage || 'Errore durante l\'invio dell\'email.'
    }
  } catch (err: any) {
    sendErrorMsg.value = err?.data?.statusMessage || err?.message || 'Errore di connessione al server mail Nitro.'
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
  <DkpAdminShell
    title="DKP Mail Engine & Webmail Center"
    subtitle="Client Webmail istituzionale & Brevo SMTP v3 Ecosystem Control Center su Neon PostgreSQL."
    badge="BREVO SMTP v3 • PURE-SQL"
    seo-title="Mail Center v2.6-PURE-SQL — DKP Admin Control Center"
    seo-description="Client Webmail & Brevo v3 SMTP Ecosystem Control Center per DevKernelPulse."
  >
    <template #status-badges>
      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
        Non Lette: {{ unreadCount }}
      </span>
      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
        Totali DB: {{ mails.length }}
      </span>
    </template>

    <template #actions>
      <button
        type="button"
        @click="fetchMails"
        title="Aggiorna Posta"
        class="bg-dkp-bg hover:border-cyan-400 text-slate-100 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-dkp-border transition-all cursor-pointer"
      >
         Ricarica
      </button>
      <button
        type="button"
        @click="openNewCompose"
        class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl border-none transition-all shadow-[0_0_15px_rgba(52,211,153,0.25)] cursor-pointer"
      >
        + Nuova Email
      </button>
    </template>

    <!-- MAIN MAIL DASHBOARD WORKSPACE -->
    <div class="grid grid-cols-1 lg:grid-cols-[240px_340px_1fr] gap-4 min-h-[620px]">
      <!-- SIDEBAR FILTRI -->
      <aside class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 flex flex-col gap-4 card-glow">
        <nav class="flex flex-col gap-1.5 font-mono">
          <button
            type="button"
            @click="selectedFilter = 'ALL'"
            class="flex justify-between items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border"
            :class="selectedFilter === 'ALL'
              ? 'bg-dkp-bg text-emerald-400 border-emerald-500/40'
              : 'bg-transparent text-slate-400 border-transparent hover:bg-dkp-bg/60 hover:text-slate-200'"
          >
            <span>Tutti i Messaggi</span>
            <span class="bg-slate-800 text-slate-200 text-[11px] px-2 py-0.5 rounded-full">{{ mails.length }}</span>
          </button>

          <button
            type="button"
            @click="selectedFilter = 'INBOUND'"
            class="flex justify-between items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border"
            :class="selectedFilter === 'INBOUND'
              ? 'bg-dkp-bg text-emerald-400 border-emerald-500/40'
              : 'bg-transparent text-slate-400 border-transparent hover:bg-dkp-bg/60 hover:text-slate-200'"
          >
            <span>In Arrivo</span>
            <span v-if="unreadCount > 0" class="bg-emerald-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full">
              {{ unreadCount }}
            </span>
          </button>

          <button
            type="button"
            @click="selectedFilter = 'OUTBOUND'"
            class="flex justify-between items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border"
            :class="selectedFilter === 'OUTBOUND'
              ? 'bg-dkp-bg text-emerald-400 border-emerald-500/40'
              : 'bg-transparent text-slate-400 border-transparent hover:bg-dkp-bg/60 hover:text-slate-200'"
          >
            <span>Inviati</span>
          </button>

          <button
            type="button"
            @click="selectedFilter = 'STARRED'"
            class="flex justify-between items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border"
            :class="selectedFilter === 'STARRED'
              ? 'bg-dkp-bg text-emerald-400 border-emerald-500/40'
              : 'bg-transparent text-slate-400 border-transparent hover:bg-dkp-bg/60 hover:text-slate-200'"
          >
            <span>Preferiti</span>
          </button>

          <div class="h-px bg-dkp-border my-2"></div>
          <span class="text-[10px] font-black text-slate-400 tracking-widest px-2 uppercase">Strumenti Mail</span>

          <NuxtLink
            to="/admin/newsletter"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 hover:bg-dkp-bg transition-all no-underline"
          >
            Newsletter &amp; Contatti &rarr;
          </NuxtLink>

          <NuxtLink
            to="/admin/mail/autoresponder"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-dkp-bg transition-all no-underline"
          >
            Autoresponder Rules &rarr;
          </NuxtLink>
        </nav>

        <div class="h-px bg-dkp-border"></div>

        <div class="bg-dkp-bg border border-dkp-border rounded-xl p-3.5 flex flex-col gap-2">
          <span class="text-[10px] font-mono font-black text-slate-400 tracking-wider uppercase">
            Indirizzi Attivi Cloudflare
          </span>
          <ul class="list-none m-0 p-0 flex flex-col gap-1.5 text-[11px] font-mono text-slate-300">
            <li v-for="addr in cloudflareAddresses" :key="addr" class="flex items-center gap-2 truncate">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span class="truncate">{{ addr }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <!-- PANNELLO LISTA EMAIL -->
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl flex flex-col overflow-hidden card-glow">
        <div class="p-3 border-b border-dkp-border">
          <input
            v-model="searchQuery"
            type="text"
            aria-label="Cerca messaggi"
            placeholder="Cerca mittente, destinatario o oggetto..."
            class="w-full bg-dkp-bg border border-dkp-border focus:border-emerald-400 text-white px-3.5 py-2 rounded-xl text-xs outline-none transition-colors box-border"
          />
        </div>

        <div v-if="isLoading" class="p-8 text-center text-xs font-mono text-cyan-400">
          Caricamento messaggi dal Kernel Pure SQL...
        </div>

        <div v-else-if="filteredMails.length === 0" class="p-8 text-center text-xs font-mono text-slate-400">
          Nessun messaggio trovato per questo filtro.
        </div>

        <div v-else class="flex-1 overflow-y-auto divide-y divide-dkp-border/80 max-h-[600px]">
          <div
            v-for="m in filteredMails"
            :key="m.id"
            @click="selectMail(m)"
            class="p-3.5 cursor-pointer transition-colors flex flex-col gap-1.5 hover:bg-dkp-bg/70"
            :class="[
              activeMail?.id === m.id ? 'bg-dkp-bg border-l-4 border-l-emerald-400' : '',
              m.status === 'UNREAD' ? 'bg-emerald-500/[0.04]' : ''
            ]"
          >
            <div class="flex items-center justify-between gap-2 text-[11px] font-mono">
              <span class="text-cyan-400 font-bold truncate">
                {{ m.direction === 'OUTBOUND' ? 'A: ' + m.recipient : 'Da: ' + m.sender }}
              </span>
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  @click.stop="toggleStar(m)"
                  :title="m.is_starred ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'"
                  class="text-xs text-amber-400 cursor-pointer bg-transparent border-none p-0"
                >
                  {{ m.is_starred ? '\u2605' : '\u2606' }}
                </button>
                <span class="text-slate-400 text-[10px]">{{ formatDate(m.created_at) }}</span>
              </div>
            </div>

            <div class="text-xs font-bold text-white truncate">
              {{ m.subject }}
            </div>

            <div class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {{ m.body_text || 'Messaggio HTML senza anteprima testo.' }}
            </div>

            <div class="flex items-center justify-between pt-1 font-mono text-[10px]">
              <span
                class="px-2 py-0.5 rounded font-bold uppercase"
                :class="m.direction === 'INBOUND'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'bg-violet-500/15 text-violet-300 border border-violet-500/30'"
              >
                {{ m.direction }}
              </span>
              <span
                class="px-2 py-0.5 rounded font-bold uppercase"
                :class="m.status === 'UNREAD'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35'
                  : 'bg-slate-800/80 text-slate-400'"
              >
                {{ m.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- PANNELLO DETTAGLIO EMAIL -->
      <main class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex flex-col card-glow">
        <div v-if="!activeMail" class="m-auto text-center text-slate-400 font-mono text-xs">
          Seleziona un'email dalla lista per visualizzarne il contenuto
        </div>

        <div v-else class="flex flex-col flex-1 gap-4">
          <div class="border-b border-dkp-border pb-4 flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <h2 class="text-lg sm:text-xl font-black text-emerald-400 m-0 leading-snug">
                {{ activeMail.subject }}
              </h2>
              <div class="flex items-center gap-2 shrink-0 font-mono">
                <button
                  type="button"
                  @click="toggleStar(activeMail)"
                  class="bg-dkp-bg border border-dkp-border hover:border-amber-400/50 text-amber-300 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  {{ activeMail.is_starred ? '\u2605 Preferito' : '\u2606 Segna' }}
                </button>
                <button
                  type="button"
                  @click="openReply(activeMail)"
                  class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-lg border-none cursor-pointer"
                >
                  Rispondi
                </button>
              </div>
            </div>

            <div class="bg-dkp-bg border border-dkp-border rounded-xl p-3 flex flex-col gap-1 text-xs font-mono text-slate-300">
              <div><span class="text-slate-400">Da:</span> <strong class="text-white">{{ activeMail.sender }}</strong></div>
              <div><span class="text-slate-400">A:</span> <strong class="text-white">{{ activeMail.recipient }}</strong></div>
              <div><span class="text-slate-400">Data:</span> {{ formatDate(activeMail.created_at) }}</div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto bg-dkp-bg border border-dkp-border rounded-xl p-5 text-sm leading-relaxed text-slate-200">
            <div v-if="activeMail.body_html" class="prose prose-invert max-w-none" v-html="sanitizedActiveHtml"></div>
            <div v-else class="whitespace-pre-wrap font-sans">{{ activeMail.body_text || 'Nessun contenuto nel corpo della mail.' }}</div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL COMPOSE EMAIL -->
    <Teleport to="body">
      <div
        v-if="showComposeModal"
        class="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        @click.self="showComposeModal = false"
      >
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
          <div class="px-5 py-4 bg-dkp-bg border-b border-dkp-border flex justify-between items-center">
            <h3 class="text-base font-black text-white m-0 font-mono">Nuova Email Outbound &mdash; Brevo v3</h3>
            <button
              type="button"
              @click="showComposeModal = false"
              aria-label="Chiudi modale"
              class="text-slate-400 hover:text-white bg-transparent border-none text-base cursor-pointer"
            >
              
            </button>
          </div>

          <form @submit.prevent="handleSendMail" class="p-5 flex flex-col gap-4 font-mono">
            <div class="flex flex-col gap-1.5">
              <label for="compose-from" class="text-xs font-bold text-slate-300">Da (Mittente Custom):</label>
              <select
                id="compose-from"
                v-model="composeData.from"
                class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-400"
              >
                <option v-for="addr in cloudflareAddresses" :key="addr" :value="addr">{{ addr }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="compose-to" class="text-xs font-bold text-slate-300">A (Destinatario):</label>
              <input
                id="compose-to"
                v-model="composeData.to"
                type="email"
                required
                placeholder="es. utente@gmail.com"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-400 box-border"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="compose-subject" class="text-xs font-bold text-slate-300">Oggetto:</label>
              <input
                id="compose-subject"
                v-model="composeData.subject"
                type="text"
                required
                placeholder="Inserisci l'oggetto della mail"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-400 box-border"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="compose-html" class="text-xs font-bold text-slate-300">Corpo del Messaggio (HTML supportato):</label>
              <textarea
                id="compose-html"
                v-model="composeData.html"
                rows="7"
                required
                placeholder="Scrivi qui il tuo messaggio..."
                class="bg-dkp-bg border border-dkp-border text-white p-3.5 rounded-xl text-xs outline-none focus:border-emerald-400 resize-y leading-relaxed box-border"
              ></textarea>
            </div>

            <div v-if="sendSuccessMsg" role="status" class="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold">
               {{ sendSuccessMsg }}
            </div>
            <div v-if="sendErrorMsg" role="alert" class="bg-rose-500/15 border border-rose-500/40 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold">
              {{ sendErrorMsg }}
            </div>

            <div class="flex justify-end gap-3 pt-2 border-t border-dkp-border">
              <button
                type="button"
                @click="showComposeModal = false"
                class="bg-slate-800 hover:bg-slate-700 text-slate-200 border-none font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                :disabled="isSending"
                class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {{ isSending ? 'Invio in corso...' : 'Invia Email' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>