<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface ApiKeyRow {
  id: number
  label: string
  keyPrefix: string
  tier: string
  rateLimitRpm: number
  requestsCount: number
  isActive: boolean
  createdAt: string
}

const apiKeys = ref<ApiKeyRow[]>([])
const isLoading = ref(true)
const newLabel = ref('')
const newTier = ref<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO')
const newRpm = ref(120)
const generatedSecret = ref('')
const feedbackMsg = ref('')

const endpoints = [
  { method: 'GET', path: '/api/v2.6/stories', auth: 'Public / Bearer', status: 'ONLINE' },
  { method: 'POST', path: '/api/ai/sentinel', auth: 'Bearer API Key', status: 'ONLINE' },
  { method: 'POST', path: '/api/vault/notarize', auth: 'Bearer API Key', status: 'ONLINE' },
  { method: 'GET', path: '/api/vault/verify', auth: 'Public / Bearer', status: 'ONLINE' },
  { method: 'POST', path: '/api/mail/send', auth: 'Admin Session', status: 'ONLINE' }
]

async function fetchKeys() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/api-gateway?_t=${Date.now()}`)
    if (res?.success) apiKeys.value = res.keys || []
  } finally {
    isLoading.value = false
  }
}

async function createKey() {
  if (!newLabel.value.trim()) return
  const res: any = await $fetch('/api/admin/api-gateway', {
    method: 'POST',
    body: { action: 'create', label: newLabel.value, tier: newTier.value, rateLimitRpm: newRpm.value }
  })
  if (res?.success) {
    generatedSecret.value = res.secretKey
    feedbackMsg.value = res.message
    newLabel.value = ''
    await fetchKeys()
  }
}

async function toggleKey(id: number) {
  await $fetch('/api/admin/api-gateway', { method: 'POST', body: { action: 'toggle', id } })
  await fetchKeys()
}

async function deleteKey(id: number) {
  if (!confirm('Revocare ed eliminare definitivamente questa API Key?')) return
  await $fetch('/api/admin/api-gateway', { method: 'POST', body: { action: 'delete', id } })
  await fetchKeys()
}

onMounted(fetchKeys)
</script>

<template>
  <DkpAdminShell
    title="API Gateway & Bearer Keys Control"
    subtitle="Emissione chiavi SHA-256, rate limiting RPM e stato degli endpoint pubblici e AI Sentinel v2.6."
    badge="API GATEWAY v2.6-PURE-SQL"
    seo-title="API Gateway — DKP Admin v2.6"
  >
    <template #actions>
      <button type="button" @click="fetchKeys" class="px-4 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-400 font-bold cursor-pointer">
         Aggiorna Gateway
      </button>
    </template>

    <div v-if="generatedSecret" class="bg-emerald-500/15 border border-emerald-400 rounded-2xl p-4 font-mono text-xs space-y-1.5">
      <div class="text-emerald-300 font-extrabold"> {{ feedbackMsg }} (Copia ora la chiave, non sar&agrave; pi&ugrave; visibile in chiaro):</div>
      <code class="block bg-dkp-bg border border-emerald-500/40 text-emerald-400 px-3 py-2 rounded-xl select-all break-all">{{ generatedSecret }}</code>
    </div>

    <!-- Form Generazione Chiave -->
    <form @submit.prevent="createKey" class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
      <input
        v-model="newLabel"
        type="text"
        required
        placeholder="Nome applicazione / client (es. Mobile App SDK)..."
        class="sm:col-span-2 bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400 box-border"
      />
      <select v-model="newTier" class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3 py-2.5 rounded-xl">
        <option value="STARTER">Tier: STARTER</option>
        <option value="PRO">Tier: PRO</option>
        <option value="ENTERPRISE">Tier: ENTERPRISE</option>
      </select>
      <button type="submit" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer">
        + Genera API Key
      </button>
    </form>

    <!-- Tabella Chiavi -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
      <div class="p-4 border-b border-dkp-border font-bold text-white">Chiavi API Registrate ({{ apiKeys.length }})</div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-dkp-bg border-b border-dkp-border text-slate-400 uppercase text-[11px]">
              <th class="p-4">Applicazione</th>
              <th class="p-4">Prefisso Chiave</th>
              <th class="p-4">Tier / Rate Limit</th>
              <th class="p-4">Chiamate</th>
              <th class="p-4">Stato</th>
              <th class="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dkp-border/60">
            <tr v-for="k in apiKeys" :key="k.id" class="hover:bg-slate-900/50">
              <td class="p-4 font-bold text-white">{{ k.label }}</td>
              <td class="p-4 text-cyan-300"><code>{{ k.keyPrefix }}</code></td>
              <td class="p-4 text-amber-300">{{ k.tier }} ({{ k.rateLimitRpm }} RPM)</td>
              <td class="p-4 text-slate-300">{{ Number(k.requestsCount || 0).toLocaleString() }}</td>
              <td class="p-4">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', k.isActive ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-rose-500/15 border-rose-500/40 text-rose-400']">
                  {{ k.isActive ? 'ACTIVE' : 'REVOKED' }}
                </span>
              </td>
              <td class="p-4 text-right space-x-2">
                <button type="button" @click="toggleKey(k.id)" class="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border-none font-bold cursor-pointer">
                  {{ k.isActive ? 'Sospendi' : 'Riattiva' }}
                </button>
                <button type="button" @click="deleteKey(k.id)" class="px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 font-bold cursor-pointer">
                  Revoca
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Mappa Endpoint -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow font-mono text-xs space-y-3">
      <h3 class="text-cyan-400 font-bold text-sm m-0">Routing Endpoint Attivi</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div v-for="ep in endpoints" :key="ep.path" class="bg-dkp-bg border border-dkp-border rounded-xl p-3 flex items-center justify-between">
          <div>
            <span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-bold mr-2">{{ ep.method }}</span>
            <code class="text-white">{{ ep.path }}</code>
          </div>
          <span class="text-emerald-400 font-bold text-[10px]">{{ ep.status }}</span>
        </div>
      </div>
    </section>
  </DkpAdminShell>
</template>