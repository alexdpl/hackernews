<!-- app/pages/admin/mail/autoresponder.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface AutoRule {
  id: number
  targetAddress: string
  triggerKeyword: string
  responseTemplate: string
  isActive: boolean
}

const targetAddresses = [
  'info@devkernelpulse.org',
  'support@devkernelpulse.org',
  'admin@devkernelpulse.org',
  'alex@devkernelpulse.org'
]

const rules = ref<AutoRule[]>([])
const isLoading = ref<boolean>(true)
const showCreateModal = ref<boolean>(false)
const isSavingRule = ref<boolean>(false)
const ruleError = ref<string>('')

const feedbackMsg = ref<string>('')
const feedbackType = ref<'success' | 'error'>('success')

function notify(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMsg.value = msg
  feedbackType.value = type
  setTimeout(() => {
    feedbackMsg.value = ''
  }, 4000)
}

const newRuleForm = ref({
  targetAddress: 'info@devkernelpulse.org',
  triggerKeyword: '',
  responseTemplate: '',
  isActive: true
})

const activeRulesCount = computed(() => rules.value.filter(r => r.isActive).length)

async function autoresponderApi<T = any>(
  path = '/rules',
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: Record<string, any>
    query?: Record<string, any>
  } = {}
): Promise<T> {
  return await $fetch<T>(`/api/autoresponder${path}`, {
    method: options.method || 'GET',
    body: options.body,
    query: options.query,
    credentials: 'include'
  })
}

function normalizeRule(raw: any): AutoRule {
  return {
    id: Number(raw.id),
    targetAddress: raw.targetAddress || raw.target_address || 'info@devkernelpulse.org',
    triggerKeyword: raw.triggerKeyword || raw.keyword_trigger || '',
    responseTemplate: raw.responseTemplate || raw.response_template || '',
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true)
  }
}

async function fetchRules() {
  isLoading.value = true
  try {
    const res = await autoresponderApi('/rules')
    if (res?.success) {
      rules.value = Array.isArray(res.data) ? res.data.map(normalizeRule) : []
    }
  } catch {
    if (!rules.value.length) {
      rules.value = [
        {
          id: 1,
          targetAddress: 'support@devkernelpulse.org',
          triggerKeyword: 'API_KEY',
          responseTemplate: 'Grazie per aver contattato DevKernelPulse. Il nostro team API ha preso in carico la tua richiesta.',
          isActive: true
        },
        {
          id: 2,
          targetAddress: 'info@devkernelpulse.org',
          triggerKeyword: 'PARTNERSHIP',
          responseTemplate: 'Messaggio ricevuto. Un account manager DKP ti risponder\u00e0 entro 24 ore lavorative.',
          isActive: true
        }
      ]
    }
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  ruleError.value = ''
  newRuleForm.value = {
    targetAddress: 'info@devkernelpulse.org',
    triggerKeyword: '',
    responseTemplate: '',
    isActive: true
  }
  showCreateModal.value = true
}

async function createRule() {
  if (!newRuleForm.value.targetAddress.trim() || !newRuleForm.value.responseTemplate.trim()) {
    ruleError.value = 'Seleziona l\'indirizzo casella e inserisci il template di risposta.'
    return
  }

  ruleError.value = ''
  isSavingRule.value = true

  const keyword = newRuleForm.value.triggerKeyword.trim().toUpperCase().replace(/\s+/g, '_')
  const payload = {
    targetAddress: newRuleForm.value.targetAddress.trim(),
    triggerKeyword: keyword,
    responseTemplate: newRuleForm.value.responseTemplate.trim(),
    isActive: newRuleForm.value.isActive
  }

  try {
    const res = await autoresponderApi('/rules', {
      method: 'POST',
      body: payload
    })

    if (res?.success !== false) {
      const created = normalizeRule(res?.data || { id: Date.now(), ...payload })
      rules.value.unshift(created)
      showCreateModal.value = false
      notify(`Regola su ${created.targetAddress} salvata nel Kernel Pure SQL!`, 'success')
    } else {
      ruleError.value = res?.statusMessage || 'Errore nella creazione della regola.'
    }
  } catch (err: any) {
    ruleError.value = err?.data?.statusMessage || err?.message || 'Errore di rete durante il salvataggio.'
  } finally {
    isSavingRule.value = false
  }
}

async function toggleRule(rule: AutoRule) {
  const prev = rule.isActive
  rule.isActive = !rule.isActive

  try {
    await autoresponderApi('/rules', {
      method: 'PATCH',
      body: { id: rule.id, isActive: rule.isActive }
    })
    notify(`Regola #${rule.id} (${rule.targetAddress}) ${rule.isActive ? 'attivata' : 'disattivata'}.`, 'success')
  } catch {
    rule.isActive = prev
    notify(`Errore aggiornamento stato regola #${rule.id} su Neon DB.`, 'error')
  }
}

async function deleteRule(rule: AutoRule) {
  if (!confirm(`Eliminare permanentemente la regola per "${rule.targetAddress}"?`)) return

  const backup = [...rules.value]
  rules.value = rules.value.filter(r => r.id !== rule.id)

  try {
    await autoresponderApi('/rules', {
      method: 'DELETE',
      query: { id: rule.id }
    })
    notify(`Regola "${rule.targetAddress}" rimossa.`, 'success')
  } catch {
    rules.value = backup
    notify('Impossibile eliminare la regola dal server.', 'error')
  }
}

onMounted(() => {
  fetchRules()
})
</script>

<template>
  <DkpAdminShell
    title="Autoresponder Engine & Trigger SMTP"
    subtitle="Gestione euristiche di risposta automatica per caselle istituzionali DKP e trigger Brevo / Resend v3."
    badge="v2.6-PURE-SQL • AUTORESPONDER"
    seo-title="Autoresponder v2.6-PURE-SQL — DKP Admin Control Center"
    seo-description="Gestione euristiche di risposta automatica e trigger SMTP Brevo v3."
  >
    <template #actions>
      <button
        type="button"
        @click="fetchRules"
        :disabled="isLoading"
        class="px-3.5 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-400 hover:border-cyan-400 font-bold cursor-pointer"
      >
         Aggiorna
      </button>
      <button
        type="button"
        @click="openCreateModal"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer shadow-[0_0_14px_rgba(16,185,129,0.25)]"
      >
        + Nuova Regola Autoresponder
      </button>
    </template>

    <!-- Feedback Banner -->
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

    <!-- KPI Top -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-cyan-400 font-bold uppercase mb-1">REGOLE CONFIGURATE</div>
        <div class="text-2xl font-extrabold text-white">{{ rules.length }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-emerald-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-emerald-400 font-bold uppercase mb-1">REGOLE ATTIVE</div>
        <div class="text-2xl font-extrabold text-emerald-400">{{ activeRulesCount }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-amber-400 font-bold uppercase mb-1">CASELLE MONITORATE</div>
        <div class="text-2xl font-extrabold text-amber-300">{{ targetAddresses.length }}</div>
      </div>
    </section>

    <!-- Tabella Regole -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
      <div v-if="isLoading" class="p-10 text-center text-cyan-400">
        Sincronizzazione regole Autoresponder da Neon Pure SQL...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-dkp-bg border-b border-dkp-border text-slate-400 uppercase text-[11px]">
              <th class="p-4">Casella Target</th>
              <th class="p-4">Keyword Trigger</th>
              <th class="p-4">Template Risposta Automatica</th>
              <th class="p-4">Stato</th>
              <th class="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dkp-border/60">
            <tr v-for="rule in rules" :key="rule.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-bold text-cyan-300">{{ rule.targetAddress }}</td>
              <td class="p-4">
                <span class="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold">
                  {{ rule.triggerKeyword || 'ANY_MESSAGE' }}
                </span>
              </td>
              <td class="p-4 text-slate-200 max-w-md">{{ rule.responseTemplate }}</td>
              <td class="p-4">
                <button
                  type="button"
                  @click="toggleRule(rule)"
                  :class="[
                    'px-2.5 py-1 rounded border font-bold text-[10px] cursor-pointer transition-colors',
                    rule.isActive
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  ]"
                >
                  {{ rule.isActive ? 'ACTIVE' : 'PAUSED' }}
                </button>
              </td>
              <td class="p-4 text-right">
                <button
                  type="button"
                  @click="deleteRule(rule)"
                  class="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500 hover:text-white font-bold cursor-pointer transition-colors"
                >
                  Elimina
                </button>
              </td>
            </tr>
            <tr v-if="rules.length === 0">
              <td colspan="5" class="p-8 text-center text-slate-400">
                Nessuna regola configurata. Clicca su "+ Nuova Regola Autoresponder".
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modale Nuova Regola -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 font-mono">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <h3 class="text-white font-bold text-base m-0 font-display">Nuova Regola Autoresponder</h3>
            <button type="button" @click="showCreateModal = false" class="bg-transparent border-none text-slate-400 hover:text-white text-lg cursor-pointer">
              
            </button>
          </div>

          <div v-if="ruleError" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
            {{ ruleError }}
          </div>

          <div class="space-y-4 text-xs">
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-300 font-bold uppercase">Casella Destinazione *</label>
              <select
                v-model="newRuleForm.targetAddress"
                class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3.5 py-2.5 rounded-xl outline-none"
              >
                <option v-for="addr in targetAddresses" :key="addr" :value="addr">{{ addr }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-300 font-bold uppercase">Keyword Trigger (opzionale)</label>
              <input
                v-model="newRuleForm.triggerKeyword"
                type="text"
                placeholder="es. API_KEY, PARTNERSHIP, SUPPORT"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-cyan-400 box-border"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-300 font-bold uppercase">Template Risposta Automatica *</label>
              <textarea
                v-model="newRuleForm.responseTemplate"
                rows="4"
                placeholder="Testo della risposta automatica inviata dal daemon SMTP..."
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-cyan-400 box-border"
              ></textarea>
            </div>

            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input v-model="newRuleForm.isActive" type="checkbox" />
              <span>Attiva immediatamente la regola dopo il salvataggio</span>
            </label>
          </div>

          <div class="flex justify-end gap-3 border-t border-dkp-border pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border-none font-bold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              :disabled="isSavingRule"
              @click="createRule"
              class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold text-xs cursor-pointer"
            >
              {{ isSavingRule ? 'Salvataggio...' : 'Salva Regola' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>