<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface AutoresponderRule {
  id: number
  triggerEvent: string
  subject: string
  bodyTemplate: string
  senderAlias: string
  sentCount: number
  isActive: boolean
  createdAt?: string
}

const rules = ref<AutoresponderRule[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const feedbackMsg = ref('')

const form = ref({
  subject: '',
  triggerEvent: 'user_registered',
  senderAlias: 'noreply@devkernelpulse.org',
  bodyTemplate: ''
})

const triggerOptions = [
  { value: 'user_registered', label: 'Trigger: user_registered (Nuova Registrazione)' },
  { value: 'newsletter_confirmed', label: 'Trigger: newsletter_confirmed (Double Opt-In)' },
  { value: 'bounty_submitted', label: 'Trigger: bounty_submitted (Nuova PR Bounty)' },
  { value: 'job_posted', label: 'Trigger: job_posted (Nuovo Annuncio Tech Job)' },
  { value: 'sentinel_alert', label: 'Trigger: sentinel_alert (Alert Sicurezza SAST)' },
  { value: 'inbound_contact', label: 'Trigger: inbound_contact (Risposta Automatica Contatti)' }
]

async function fetchRules() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/autoresponder?_t=${Date.now()}`)
    if (res?.success) rules.value = res.rules || []
  } finally {
    isLoading.value = false
  }
}

async function createRule() {
  if (!form.value.subject.trim()) return
  isSaving.value = true
  try {
    const res: any = await $fetch('/api/admin/autoresponder', {
      method: 'POST',
      body: { action: 'create', ...form.value }
    })
    if (res?.success) {
      feedbackMsg.value = res.message
      form.value.subject = ''
      form.value.bodyTemplate = ''
      await fetchRules()
    }
  } finally {
    isSaving.value = false
  }
}

async function toggleRule(id: number) {
  await $fetch('/api/admin/autoresponder', { method: 'POST', body: { action: 'toggle', id } })
  await fetchRules()
}

async function deleteRule(id: number) {
  if (!confirm('Eliminare questa regola di risposta automatica?')) return
  await $fetch('/api/admin/autoresponder', { method: 'POST', body: { action: 'delete', id } })
  await fetchRules()
}

onMounted(fetchRules)
</script>

<template>
  <DkpAdminShell
    title="DKP Mail Nexus — Autoresponder"
    subtitle="Risposte Automatiche Event-Driven & Alert Sentinelle tramite Brevo SMTP v3 & Cloudflare Email Routing."
    badge="RISPOSTE AUTOMATICHE EVENT-DRIVEN"
    seo-title="DKP Mail Nexus Autoresponder — Admin v2.6"
  >
    <template #actions>
      <NuxtLink
        to="/admin/mail"
        class="px-3.5 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-300 font-bold no-underline"
      >
        &larr; Mail Center
      </NuxtLink>
      <button
        type="button"
        @click="fetchRules"
        class="px-3.5 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-emerald-400 font-bold cursor-pointer"
      >
         Aggiorna Regole
      </button>
    </template>

    <div v-if="feedbackMsg" class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl">
       {{ feedbackMsg }}
    </div>

    <!-- FORM CREAZIONE REGOLA CON INPUT E SELECT NERI -->
    <form @submit.prevent="createRule" class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow space-y-4 font-mono text-xs">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        <input
          v-model="form.subject"
          type="text"
          required
          placeholder="Oggetto email automatica..."
          class="lg:col-span-5 bg-[#030712] border border-slate-700 text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-cyan-400 box-border"
        />

        <select
          v-model="form.triggerEvent"
          class="lg:col-span-4 bg-[#030712] border border-slate-700 text-cyan-300 px-4 py-3 rounded-xl font-bold outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option
            v-for="opt in triggerOptions"
            :key="opt.value"
            :value="opt.value"
            class="bg-[#030712] text-white"
          >
            {{ opt.label }}
          </option>
        </select>

        <button
          type="submit"
          :disabled="isSaving"
          class="lg:col-span-3 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer disabled:opacity-50"
        >
          {{ isSaving ? 'Attivazione...' : '+ Attiva Regola' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <input
          v-model="form.senderAlias"
          type="email"
          placeholder="Mittente (es. noreply@devkernelpulse.org)"
          class="lg:col-span-4 bg-[#030712] border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl outline-none box-border"
        />
        <input
          v-model="form.bodyTemplate"
          type="text"
          placeholder="Corpo messaggio automatico (supporta {{username}}, {{event}})..."
          class="lg:col-span-8 bg-[#030712] border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl outline-none box-border"
        />
      </div>
    </form>

    <!-- LISTA REGOLE ATTIVE -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
      <div class="p-4 border-b border-dkp-border flex items-center justify-between">
        <span class="font-bold text-white">Regole Event-Driven Registrate ({{ rules.length }})</span>
        <span class="text-[11px] text-slate-400">Engine: Brevo Transactional SMTP</span>
      </div>

      <div v-if="isLoading" class="p-8 text-center text-cyan-400">Caricamento regole autoresponder...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#030712] border-b border-dkp-border text-slate-400 uppercase text-[11px]">
              <th class="p-4">Trigger Evento</th>
              <th class="p-4">Oggetto &amp; Mittente</th>
              <th class="p-4">Invii</th>
              <th class="p-4">Stato</th>
              <th class="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dkp-border/60">
            <tr v-for="r in rules" :key="r.id" class="hover:bg-slate-900/50">
              <td class="p-4">
                <span class="px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-bold">
                  {{ r.triggerEvent }}
                </span>
              </td>
              <td class="p-4">
                <div class="font-bold text-white font-sans text-sm">{{ r.subject }}</div>
                <div class="text-[11px] text-slate-400">{{ r.senderAlias }}</div>
              </td>
              <td class="p-4 text-emerald-400 font-bold">{{ r.sentCount }}</td>
              <td class="p-4">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', r.isActive ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/15 border-amber-500/40 text-amber-300']">
                  {{ r.isActive ? 'ATTIVA' : 'IN PAUSA' }}
                </span>
              </td>
              <td class="p-4 text-right space-x-2">
                <button type="button" @click="toggleRule(r.id)" class="px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 border-none font-bold cursor-pointer">
                  {{ r.isActive ? 'Pausa' : 'Attiva' }}
                </button>
                <button type="button" @click="deleteRule(r.id)" class="px-2.5 py-1.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 font-bold cursor-pointer">
                  Elimina
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </DkpAdminShell>
</template>