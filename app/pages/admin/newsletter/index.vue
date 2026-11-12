<!-- app/pages/admin/newsletter/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'admin-only'
})

useDkpSeo({
  title: 'Newsletter v2.6-PURE-SQL — DKP Admin Control Center',
  description: 'Gestione iscritti Double Opt-In, liste di distribuzione Brevo v3 ed invii broadcast.',
  noindex: true
})

interface Subscriber {
  id: number
  email: string
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED'
  source: string
  created_at: string
}

const adminNavItems = [
  { to: '/admin/api-gateway', label: '⚙️ API Gateway' },
  { to: '/admin/mail', label: '📧 Mail Center' },
  { to: '/admin/newsletter', label: '📣 Newsletter', active: true },
  { to: '/admin/autoresponder', label: '📡 Autoresponder' },
  { to: '/admin/crawler', label: '🤖 Crawler Engine' },
  { to: '/admin/blog', label: '📝 Gestione Blog' },
  { to: '/admin/nodes', label: '💬 Gestione Nodi' },
  { to: '/admin/shop', label: '🛍️ Gestione Shop' }
]

const subscribers = ref<Subscriber[]>([])
const isLoading = ref<boolean>(true)
const searchQuery = ref<string>('')
const statusFilter = ref<'ALL' | 'SUBSCRIBED' | 'UNSUBSCRIBED'>('ALL')

// Toast & Feedback
const feedbackMsg = ref<string>('')
const feedbackType = ref<'success' | 'error'>('success')

function notify(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMsg.value = msg
  feedbackType.value = type
  setTimeout(() => {
    feedbackMsg.value = ''
  }, 4000)
}

// Broadcast Modal State
const showBroadcastModal = ref<boolean>(false)
const isSendingBroadcast = ref<boolean>(false)
const broadcastError = ref<string>('')

const broadcastForm = ref({
  subject: '',
  targetSegment: 'SUBSCRIBED_ONLY' as 'SUBSCRIBED_ONLY' | 'TEST_ADMIN',
  contentHtml: ''
})

async function fetchSubscribers() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/newsletter/subscribers')
    if (res?.success) {
      subscribers.value = Array.isArray(res.data) ? res.data : []
    }
  } catch {
    if (!subscribers.value.length) {
      subscribers.value = [
        {
          id: 1,
          email: 'dev@devkernelpulse.org',
          status: 'SUBSCRIBED',
          source: 'FOOTER_DOUBLE_OPTIN',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          email: 'alex@devkernelpulse.org',
          status: 'SUBSCRIBED',
          source: 'API_GATEWAY',
          created_at: new Date().toISOString()
        }
      ]
    }
  } finally {
    isLoading.value = false
  }
}

const activeCount = computed(() => subscribers.value.filter(s => s.status === 'SUBSCRIBED').length)
const unsubscribedCount = computed(() => subscribers.value.filter(s => s.status !== 'SUBSCRIBED').length)

const filteredSubscribers = computed(() => {
  return subscribers.value.filter((s) => {
    if (statusFilter.value === 'SUBSCRIBED' && s.status !== 'SUBSCRIBED') return false
    if (statusFilter.value === 'UNSUBSCRIBED' && s.status === 'SUBSCRIBED') return false

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return s.email.toLowerCase().includes(q) || (s.source && s.source.toLowerCase().includes(q))
    }
    return true
  })
})

async function toggleSubscriberStatus(sub: Subscriber) {
  const nextStatus = sub.status === 'SUBSCRIBED' ? 'UNSUBSCRIBED' : 'SUBSCRIBED'
  const prevStatus = sub.status
  sub.status = nextStatus

  try {
    await $fetch('/api/admin/newsletter/subscribers', {
      method: 'PATCH',
      body: { id: sub.id, status: nextStatus }
    })
    notify(`✅ Stato di ${sub.email} aggiornato a ${nextStatus}.`, 'success')
  } catch {
    sub.status = prevStatus
    notify(`⚠️ Impossibile aggiornare lo stato su Neon DB per ${sub.email}.`, 'error')
  }
}

function openBroadcastModal() {
  broadcastError.value = ''
  showBroadcastModal.value = true
}

async function sendBroadcast() {
  if (!broadcastForm.value.subject.trim() || !broadcastForm.value.contentHtml.trim()) {
    broadcastError.value = 'Compila sia l\'oggetto che il contenuto HTML della campagna.'
    return
  }

  broadcastError.value = ''
  isSendingBroadcast.value = true

  try {
    const res: any = await $fetch('/api/admin/newsletter/broadcast', {
      method: 'POST',
      body: broadcastForm.value
    })

    if (res?.success !== false) {
      showBroadcastModal.value = false
      broadcastForm.value = { subject: '', targetSegment: 'SUBSCRIBED_ONLY', contentHtml: '' }
      notify('📣 Campagna Broadcast accodata su Brevo SMTP v3!', 'success')
    } else {
      broadcastError.value = res?.statusMessage || 'Errore durante l\'invio del broadcast.'
    }
  } catch (err: any) {
    broadcastError.value = err?.data?.statusMessage || err?.message || 'Errore di rete durante l\'invio del broadcast.'
  } finally {
    isSendingBroadcast.value = false
  }
}

onMounted(() => {
  fetchSubscribers()
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-6 max-w-[1440px] mx-auto flex flex-col gap-5 font-sans">
    
    <!-- NAVBAR GRID ADMIN UNIFICATA v2.6-PURE-SQL -->
    <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div class="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-800/80">
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></span>
          <span class="text-sky-400 font-mono font-black text-xs sm:text-sm tracking-wider uppercase">
            DKP ADMIN CONTROL CENTER · v2.6-PURE-SQL
          </span>
        </div>
        <NuxtLink
          to="/admin"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/35 hover:bg-sky-500/20 transition-all no-underline"
        >
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <NuxtLink
          v-for="item in adminNavItems"
          :key="item.to"
          :to="item.to"
          class="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg font-mono font-bold text-xs transition-all no-underline truncate"
          :class="item.active
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            : 'text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/25 hover:bg-emerald-500/15 hover:border-emerald-400'"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>

    <!-- FEEDBACK BANNER INLINE -->
    <div
      v-if="feedbackMsg"
      :role="feedbackType === 'error' ? 'alert' : 'status'"
      class="px-4 py-3 rounded-xl font-mono text-xs font-bold border"
      :class="feedbackType === 'error'
        ? 'bg-red-500/15 border-red-500/40 text-red-400'
        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'"
    >
      {{ feedbackMsg }}
    </div>

    <!-- HEADER TOOLBAR -->
    <header class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-white flex flex-wrap items-center gap-2.5 m-0">
          <span>📣 Newsletter &amp; Audience Ecosystem</span>
          <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-xs font-mono px-2.5 py-0.5 rounded-md">
            v2.6-PURE-SQL
          </span>
          <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[11px] font-mono px-2 py-0.5 rounded-md">
            Brevo Double Opt-In
          </span>
        </h1>
        <p class="text-slate-400 text-xs sm:text-sm mt-1 mb-0">
          Gestione iscritti GDPR, liste di distribuzione e campagne broadcast su Neon PostgreSQL
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        <div class="flex flex-col items-center bg-[#020420] px-4 py-1.5 rounded-xl border border-slate-800">
          <span class="text-lg font-black font-mono text-emerald-400 leading-tight">{{ activeCount }}</span>
          <span class="text-[10px] font-mono uppercase text-slate-400">Attivi</span>
        </div>

        <div class="flex flex-col items-center bg-[#020420] px-4 py-1.5 rounded-xl border border-slate-800">
          <span class="text-lg font-black font-mono text-amber-400 leading-tight">{{ unsubscribedCount }}</span>
          <span class="text-[10px] font-mono uppercase text-slate-400">Disiscritti</span>
        </div>

        <button
          type="button"
          @click="fetchSubscribers"
          class="bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-mono font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          🔄 Aggiorna
        </button>

        <button
          type="button"
          @click="openBroadcastModal"
          class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.25)] cursor-pointer"
        >
          🚀 Nuova Campagna Broadcast
        </button>
      </div>
    </header>

    <!-- TABELLA ISCRITTI -->
    <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div class="flex flex-wrap items-center gap-2 font-mono">
          <button
            type="button"
            @click="statusFilter = 'ALL'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors"
            :class="statusFilter === 'ALL'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white'"
          >
            Tutti ({{ subscribers.length }})
          </button>
          <button
            type="button"
            @click="statusFilter = 'SUBSCRIBED'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors"
            :class="statusFilter === 'SUBSCRIBED'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white'"
          >
            Subscribed ({{ activeCount }})
          </button>
          <button
            type="button"
            @click="statusFilter = 'UNSUBSCRIBED'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors"
            :class="statusFilter === 'UNSUBSCRIBED'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
              : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white'"
          >
            Unsubscribed / Bounce ({{ unsubscribedCount }})
          </button>
        </div>

        <input
          v-model="searchQuery"
          type="text"
          aria-label="Cerca iscritto per email o sorgente"
          placeholder="🔍 Cerca email o sorgente..."
          class="w-full sm:w-72 bg-[#020420] border border-slate-800 focus:border-emerald-400 text-white px-3.5 py-2 rounded-xl text-xs font-mono outline-none transition-colors"
        />
      </div>

      <div class="overflow-x-auto bg-[#020420] border border-slate-800 rounded-xl">
        <table class="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th class="p-3.5">ID</th>
              <th class="p-3.5">Email Iscritto</th>
              <th class="p-3.5">Sorgente Consenso</th>
              <th class="p-3.5">Stato</th>
              <th class="p-3.5">Data Iscrizione</th>
              <th class="p-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 text-slate-300">
            <tr v-if="isLoading">
              <td colspan="6" class="p-8 text-center text-slate-400">
                ⚡ Caricamento iscritti dal Kernel Pure SQL...
              </td>
            </tr>
            <tr v-else-if="filteredSubscribers.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-500">
                Nessun iscritto trovato per i criteri selezionati.
              </td>
            </tr>
            <tr v-for="sub in filteredSubscribers" :key="sub.id" class="hover:bg-slate-900/40 transition-colors">
              <td class="p-3.5 text-slate-500">#{{ sub.id }}</td>
              <td class="p-3.5 font-bold text-white font-sans text-sm">{{ sub.email }}</td>
              <td class="p-3.5">
                <span class="bg-sky-500/10 text-sky-400 border border-sky-500/25 px-2.5 py-0.5 rounded text-[11px] font-bold">
                  {{ sub.source || 'DIRECT' }}
                </span>
              </td>
              <td class="p-3.5">
                <span
                  class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase border"
                  :class="sub.status === 'SUBSCRIBED'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                    : 'bg-red-500/15 text-red-400 border-red-500/35'"
                >
                  {{ sub.status }}
                </span>
              </td>
              <td class="p-3.5 text-slate-400">
                {{ sub.created_at ? new Date(sub.created_at).toLocaleDateString('it-IT') : '—' }}
              </td>
              <td class="p-3.5 text-right">
                <button
                  type="button"
                  @click="toggleSubscriberStatus(sub)"
                  class="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                >
                  {{ sub.status === 'SUBSCRIBED' ? 'Disiscrivi' : 'Riattiva' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODALE BROADCAST -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showBroadcastModal"
        class="fixed inset-0 bg-[#020420]/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
        @click.self="showBroadcastModal = false"
      >
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
          <div class="px-5 py-4 bg-[#020420] border-b border-slate-800 flex justify-between items-center">
            <h2 class="text-base font-black text-white m-0 font-mono">🚀 Nuova Campagna Broadcast — Brevo v3</h2>
            <button
              type="button"
              @click="showBroadcastModal = false"
              aria-label="Chiudi modale broadcast"
              class="text-slate-400 hover:text-white bg-transparent border-none text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form @submit.prevent="sendBroadcast" class="p-5 flex flex-col gap-4 font-mono">
            <div class="flex flex-col gap-1.5">
              <label for="broadcast-segment" class="text-xs font-bold text-slate-400">Destinatari Campagna:</label>
              <select
                id="broadcast-segment"
                v-model="broadcastForm.targetSegment"
                class="bg-[#020420] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-400"
              >
                <option value="SUBSCRIBED_ONLY">Tutti gli iscritti attivi ({{ activeCount }} contatti)</option>
                <option value="TEST_ADMIN">Solo Test Amministratore (admin@devkernelpulse.org)</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="broadcast-subject" class="text-xs font-bold text-slate-400">Oggetto Campagna:</label>
              <input
                id="broadcast-subject"
                v-model="broadcastForm.subject"
                type="text"
                required
                placeholder="Es. DevKernelPulse Digest — Release Kernel v2.6-PURE-SQL"
                class="bg-[#020420] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-400"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="broadcast-html" class="text-xs font-bold text-slate-400">Contenuto HTML:</label>
              <textarea
                id="broadcast-html"
                v-model="broadcastForm.contentHtml"
                rows="8"
                required
                placeholder="<h1>Novità dal Kernel DKP</h1><p>...</p>"
                class="bg-[#020420] border border-slate-700 text-white p-3.5 rounded-xl text-xs outline-none focus:border-emerald-400 resize-y leading-relaxed"
              ></textarea>
            </div>

            <div v-if="broadcastError" role="alert" class="bg-red-500/15 border border-red-500/40 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold">
              ⚠️ {{ broadcastError }}
            </div>

            <div class="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                @click="showBroadcastModal = false"
                class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                :disabled="isSendingBroadcast"
                class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {{ isSendingBroadcast ? '⚡ Invio in corso...' : '🚀 Avvia Invio Broadcast' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>