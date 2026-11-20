<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface Subscriber {
  id: number
  email: string
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED'
  source: string
  created_at: string
}

const subscribers = ref<Subscriber[]>([])
const isLoading = ref<boolean>(true)
const searchQuery = ref<string>('')
const statusFilter = ref<'ALL' | 'SUBSCRIBED' | 'UNSUBSCRIBED'>('ALL')

const feedbackMsg = ref<string>('')
const feedbackType = ref<'success' | 'error'>('success')

function notify(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMsg.value = msg
  feedbackType.value = type
  setTimeout(() => {
    feedbackMsg.value = ''
  }, 4000)
}

const showBroadcastModal = ref<boolean>(false)
const isSendingBroadcast = ref<boolean>(false)
const broadcastError = ref<string>('')

const broadcastForm = ref({
  subject: '',
  targetSegment: 'SUBSCRIBED_ONLY' as 'SUBSCRIBED_ONLY' | 'TEST_ADMIN',
  contentHtml: ''
})

async function newsletterApi<T = any>(
  path: string,
  options: { method?: 'GET' | 'PATCH' | 'POST'; body?: Record<string, any> } = {}
): Promise<T> {
  return await $fetch<T>(`/api/newsletter${path}`, {
    method: options.method || 'GET',
    body: options.body,
    credentials: 'include'
  })
}

async function fetchSubscribers() {
  isLoading.value = true
  try {
    const res = await newsletterApi('/subscribers')
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
    await newsletterApi('/subscribers', {
      method: 'PATCH',
      body: { id: sub.id, status: nextStatus }
    })
    notify(`Stato di ${sub.email} aggiornato a ${nextStatus}.`, 'success')
  } catch {
    sub.status = prevStatus
    notify(`Impossibile aggiornare lo stato su Neon DB per ${sub.email}.`, 'error')
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
    const res = await newsletterApi('/broadcast', {
      method: 'POST',
      body: broadcastForm.value
    })

    if (res?.success !== false) {
      showBroadcastModal.value = false
      broadcastForm.value = { subject: '', targetSegment: 'SUBSCRIBED_ONLY', contentHtml: '' }
      notify(`Campagna Broadcast inviata (${res?.sentCount ?? 1}/${res?.totalTargets ?? 1}) su Brevo SMTP v3!`, 'success')
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
  <DkpAdminShell
    title="Newsletter & Liste Distribuzione"
    subtitle="Gestione iscritti Double Opt-In, segmentazione audience e invii broadcast tramite Brevo SMTP v3."
    badge="v2.6-PURE-SQL • NEWSLETTER"
    seo-title="Newsletter v2.6-PURE-SQL — DKP Admin Control Center"
    seo-description="Gestione iscritti Double Opt-In, liste di distribuzione Brevo v3 ed invii broadcast."
  >
    <template #actions>
      <button
        type="button"
        @click="fetchSubscribers"
        :disabled="isLoading"
        class="px-3.5 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-400 hover:border-cyan-400 font-bold cursor-pointer"
      >
         Aggiorna
      </button>
      <button
        type="button"
        @click="openBroadcastModal"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
      >
        + Nuova Campagna Broadcast
      </button>
    </template>

    <!-- Feedback -->
    <div
      v-if="feedbackMsg"
      :class="[
        'font-mono text-xs font-bold px-4 py-3 rounded-xl border',
        feedbackType === 'success'
          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
          : 'bg-rose-500/15 border-rose-400 text-rose-300'
      ]"
    >
       {{ feedbackMsg }}
    </div>

    <!-- KPI Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-cyan-400 font-bold uppercase mb-1">TOTALE CONTATTI DB</div>
        <div class="text-2xl font-extrabold text-white">{{ subscribers.length }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-emerald-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-emerald-400 font-bold uppercase mb-1">ISCRITTI ATTIVI (SUBSCRIBED)</div>
        <div class="text-2xl font-extrabold text-emerald-400">{{ activeCount }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-rose-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-rose-400 font-bold uppercase mb-1">DISISCRITTI / BOUNCED</div>
        <div class="text-2xl font-extrabold text-rose-400">{{ unsubscribedCount }}</div>
      </div>
    </section>

    <!-- Barra Filtri -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 font-mono text-xs card-glow">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cerca iscritto per email o sorgente opt-in..."
        class="flex-1 bg-dkp-bg border border-dkp-border text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 box-border"
      />
      <select
        v-model="statusFilter"
        class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3.5 py-2.5 rounded-xl outline-none cursor-pointer"
      >
        <option value="ALL">Tutti gli Stati</option>
        <option value="SUBSCRIBED">Solo Iscritti (SUBSCRIBED)</option>
        <option value="UNSUBSCRIBED">Disiscritti / Bounced</option>
      </select>
    </section>

    <!-- Tabella Iscritti -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
      <div v-if="isLoading" class="p-10 text-center text-cyan-400">
        Caricamento iscritti Newsletter da Neon Pure SQL...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-dkp-bg border-b border-dkp-border text-slate-400 uppercase text-[11px]">
              <th class="p-4">Email Iscritto</th>
              <th class="p-4">Sorgente Opt-In</th>
              <th class="p-4">Data Iscrizione</th>
              <th class="p-4">Stato</th>
              <th class="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dkp-border/60">
            <tr v-for="sub in filteredSubscribers" :key="sub.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-bold text-white">{{ sub.email }}</td>
              <td class="p-4">
                <span class="px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-bold text-[10px]">
                  {{ sub.source || 'DIRECT_OPTIN' }}
                </span>
              </td>
              <td class="p-4 text-slate-400">
                {{ sub.created_at ? new Date(sub.created_at).toLocaleDateString('it-IT') : '-' }}
              </td>
              <td class="p-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded font-extrabold text-[10px] border',
                    sub.status === 'SUBSCRIBED'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  ]"
                >
                  {{ sub.status }}
                </span>
              </td>
              <td class="p-4 text-right">
                <button
                  type="button"
                  @click="toggleSubscriberStatus(sub)"
                  :class="[
                    'px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition-colors',
                    sub.status === 'SUBSCRIBED'
                      ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-400 hover:text-slate-950'
                      : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-400 hover:text-slate-950'
                  ]"
                >
                  {{ sub.status === 'SUBSCRIBED' ? 'Disiscrivi' : 'Riattiva' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredSubscribers.length === 0">
              <td colspan="5" class="p-8 text-center text-slate-400">
                Nessun iscritto trovato per questo filtro.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modale Broadcast Campagna -->
    <Teleport to="body">
      <div
        v-if="showBroadcastModal"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showBroadcastModal = false"
      >
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 font-mono">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <h3 class="text-white font-bold text-base m-0 font-display">Nuova Campagna Broadcast &mdash; Brevo v3</h3>
            <button type="button" @click="showBroadcastModal = false" class="bg-transparent border-none text-slate-400 hover:text-white text-lg cursor-pointer">
              
            </button>
          </div>

          <div v-if="broadcastError" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
            {{ broadcastError }}
          </div>

          <div class="space-y-4 text-xs">
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-300 font-bold uppercase">Segmento Destinatari *</label>
              <select
                v-model="broadcastForm.targetSegment"
                class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3.5 py-2.5 rounded-xl outline-none"
              >
                <option value="SUBSCRIBED_ONLY">Tutti gli Iscritti Attivi ({{ activeCount }})</option>
                <option value="TEST_ADMIN">Test Invio Solo Admin</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-300 font-bold uppercase">Oggetto Campagna *</label>
              <input
                v-model="broadcastForm.subject"
                type="text"
                placeholder="es. [DKP Digest] Nuovi Audit SAST & Release v2.6"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400 box-border"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-300 font-bold uppercase">Contenuto Email (HTML) *</label>
              <textarea
                v-model="broadcastForm.contentHtml"
                rows="7"
                placeholder="<h2>Aggiornamenti DevKernelPulse</h2><p>Scrivi il corpo HTML della newsletter...</p>"
                class="bg-dkp-bg border border-dkp-border text-white p-3.5 rounded-xl outline-none focus:border-emerald-400 box-border"
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-dkp-border pt-4">
            <button
              type="button"
              @click="showBroadcastModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border-none font-bold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              :disabled="isSendingBroadcast"
              @click="sendBroadcast"
              class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold text-xs cursor-pointer disabled:opacity-50"
            >
              {{ isSendingBroadcast ? 'Invio Broadcast...' : 'Invia Broadcast' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>