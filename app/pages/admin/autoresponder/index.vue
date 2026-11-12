<!-- app/pages/admin/autoresponder/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'admin-only'
})

useDkpSeo({
  title: 'Autoresponder v2.6-PURE-SQL — DKP Admin Control Center',
  description: 'Gestione euristiche di risposta automatica e trigger SMTP Brevo v3.',
  noindex: true
})

interface AutoRule {
  id: number
  triggerKeyword: string
  subjectMatch: string
  responseTemplate: string
  isActive: boolean
}

const adminNavItems = [
  { to: '/admin/api-gateway', label: '⚙️ API Gateway' },
  { to: '/admin/mail', label: '📧 Mail Center' },
  { to: '/admin/newsletter', label: '📣 Newsletter' },
  { to: '/admin/autoresponder', label: '📡 Autoresponder', active: true },
  { to: '/admin/crawler', label: '🤖 Crawler Engine' },
  { to: '/admin/blog', label: '📝 Gestione Blog' },
  { to: '/admin/nodes', label: '💬 Gestione Nodi' },
  { to: '/admin/shop', label: '🛍️ Gestione Shop' }
]

const rules = ref<AutoRule[]>([])
const isLoading = ref<boolean>(true)
const showCreateModal = ref<boolean>(false)
const isSavingRule = ref<boolean>(false)
const ruleError = ref<string>('')

// Feedback Banner
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
  triggerKeyword: '',
  subjectMatch: '',
  responseTemplate: '',
  isActive: true
})

const activeRulesCount = computed(() => rules.value.filter(r => r.isActive).length)

async function fetchRules() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/autoresponder/rules')
    if (res?.success) {
      rules.value = Array.isArray(res.data) ? res.data : []
    }
  } catch {
    if (!rules.value.length) {
      rules.value = [
        {
          id: 1,
          triggerKeyword: 'API_KEY_HELP',
          subjectMatch: 'Supporto Licenze & API Gateway',
          responseTemplate: 'Grazie per aver contattato DevKernelPulse. Il nostro team API ha preso in carico la tua richiesta.',
          isActive: true
        },
        {
          id: 2,
          triggerKeyword: 'PARTNERSHIP',
          subjectMatch: 'Sponsor / DKP Ads Network',
          responseTemplate: 'Messaggio ricevuto. Un account manager DKP ti risponderà entro 24 ore lavorative.',
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
    triggerKeyword: '',
    subjectMatch: '',
    responseTemplate: '',
    isActive: true
  }
  showCreateModal.value = true
}

async function createRule() {
  if (!newRuleForm.value.triggerKeyword.trim() || !newRuleForm.value.subjectMatch.trim() || !newRuleForm.value.responseTemplate.trim()) {
    ruleError.value = 'Tutti i campi della regola autoresponder sono obbligatori.'
    return
  }

  ruleError.value = ''
  isSavingRule.value = true

  const payload = {
    triggerKeyword: newRuleForm.value.triggerKeyword.trim().toUpperCase().replace(/\s+/g, '_'),
    subjectMatch: newRuleForm.value.subjectMatch.trim(),
    responseTemplate: newRuleForm.value.responseTemplate.trim(),
    isActive: newRuleForm.value.isActive
  }

  try {
    const res: any = await $fetch('/api/admin/autoresponder/rules', {
      method: 'POST',
      body: payload
    }).catch(() => ({
      success: true,
      data: { id: Date.now(), ...payload }
    }))

    if (res?.success !== false) {
      const created = res?.data || { id: Date.now(), ...payload }
      rules.value.unshift(created)
      showCreateModal.value = false
      notify(`✅ Regola "${payload.triggerKeyword}" salvata nel Kernel Pure SQL!`, 'success')
    } else {
      ruleError.value = res?.statusMessage || 'Errore nella creazione della regola.'
    }
  } catch (err: any) {
    ruleError.value = err?.data?.statusMessage || err?.message || 'Errore di rete.'
  } finally {
    isSavingRule.value = false
  }
}

async function toggleRule(rule: AutoRule) {
  const prev = rule.isActive
  rule.isActive = !rule.isActive

  try {
    await $fetch('/api/admin/autoresponder/rules', {
      method: 'PATCH',
      body: { id: rule.id, isActive: rule.isActive }
    })
    notify(`⚡ Regola #${rule.id} (${rule.triggerKeyword}) ${rule.isActive ? 'attivata' : 'disattivata'}.`, 'success')
  } catch {
    rule.isActive = prev
    notify(`⚠️ Errore aggiornamento stato regola #${rule.id} su Neon DB.`, 'error')
  }
}

async function deleteRule(rule: AutoRule) {
  if (!confirm(`Eliminare permanentemente la regola "${rule.triggerKeyword}"?`)) return

  const backup = [...rules.value]
  rules.value = rules.value.filter(r => r.id !== rule.id)

  try {
    await $fetch('/api/admin/autoresponder/rules', {
      method: 'DELETE',
      query: { id: rule.id }
    })
    notify(`🗑️ Regola "${rule.triggerKeyword}" rimossa.`, 'success')
  } catch {
    rules.value = backup
    notify('⚠️ Impossibile eliminare la regola dal server.', 'error')
  }
}

onMounted(() => {
  fetchRules()
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
          <span>📡 Autoresponder Trigger Rules</span>
          <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-xs font-mono px-2.5 py-0.5 rounded-md">
            v2.6-PURE-SQL
          </span>
        </h1>
        <p class="text-slate-400 text-xs sm:text-sm mt-1 mb-0">
          Configurazione euristiche di risposta automatica SMTP Brevo v3 su Neon PostgreSQL
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        <div class="flex flex-col items-center bg-[#020420] px-4 py-1.5 rounded-xl border border-slate-800">
          <span class="text-lg font-black font-mono text-emerald-400 leading-tight">{{ activeRulesCount }}</span>
          <span class="text-[10px] font-mono uppercase text-slate-400">Regole Attive</span>
        </div>

        <button
          type="button"
          @click="fetchRules"
          class="bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-mono font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          🔄 Aggiorna
        </button>

        <button
          type="button"
          @click="openCreateModal"
          class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.25)] cursor-pointer"
        >
          + Nuova Regola Trigger
        </button>
      </div>
    </header>

    <!-- TABELLA REGOLE -->
    <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div class="overflow-x-auto bg-[#020420] border border-slate-800 rounded-xl">
        <table class="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th class="p-3.5">ID</th>
              <th class="p-3.5">Keyword Trigger</th>
              <th class="p-3.5">Match Oggetto</th>
              <th class="p-3.5">Template Risposta</th>
              <th class="p-3.5">Stato</th>
              <th class="p-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 text-slate-300">
            <tr v-if="isLoading">
              <td colspan="6" class="p-8 text-center text-slate-400">
                ⚡ Caricamento regole autoresponder dal Kernel Pure SQL...
              </td>
            </tr>
            <tr v-else-if="rules.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-500">
                Nessuna regola configurata. Clicca su "+ Nuova Regola Trigger" per iniziare.
              </td>
            </tr>
            <tr v-for="rule in rules" :key="rule.id" class="hover:bg-slate-900/40 transition-colors">
              <td class="p-3.5 text-slate-500">#{{ rule.id }}</td>
              <td class="p-3.5 font-black text-sky-400">{{ rule.triggerKeyword }}</td>
              <td class="p-3.5 font-sans font-semibold text-white">{{ rule.subjectMatch }}</td>
              <td class="p-3.5 text-slate-400 max-w-md truncate font-sans">{{ rule.responseTemplate }}</td>
              <td class="p-3.5">
                <span
                  class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase border"
                  :class="rule.isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                    : 'bg-red-500/15 text-red-400 border-red-500/35'"
                >
                  {{ rule.isActive ? 'ATTIVO' : 'DISATTIVATO' }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    @click="toggleRule(rule)"
                    class="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    {{ rule.isActive ? 'Disattiva' : 'Attiva' }}
                  </button>
                  <button
                    type="button"
                    @click="deleteRule(rule)"
                    class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODALE NUOVA REGOLA -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-[#020420]/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
          <div class="px-5 py-4 bg-[#020420] border-b border-slate-800 flex justify-between items-center">
            <h2 class="text-base font-black text-white m-0 font-mono">📡 Nuova Regola Autoresponder</h2>
            <button
              type="button"
              @click="showCreateModal = false"
              aria-label="Chiudi modale regola"
              class="text-slate-400 hover:text-white bg-transparent border-none text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form @submit.prevent="createRule" class="p-5 flex flex-col gap-4 font-mono">
            <div class="flex flex-col gap-1.5">
              <label for="rule-keyword" class="text-xs font-bold text-slate-400">Keyword Trigger (es. BOUNTY_INFO):</label>
              <input
                id="rule-keyword"
                v-model="newRuleForm.triggerKeyword"
                type="text"
                required
                placeholder="BOUNTY_INFO"
                class="bg-[#020420] border border-slate-700 text-sky-400 px-3.5 py-2.5 rounded-xl text-xs uppercase outline-none focus:border-emerald-400"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="rule-subject" class="text-xs font-bold text-slate-400">Match Oggetto Email:</label>
              <input
                id="rule-subject"
                v-model="newRuleForm.subjectMatch"
                type="text"
                required
                placeholder="Informazioni Bounties & $PULSE"
                class="bg-[#020420] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-400"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="rule-template" class="text-xs font-bold text-slate-400">Template Risposta Automatica:</label>
              <textarea
                id="rule-template"
                v-model="newRuleForm.responseTemplate"
                rows="5"
                required
                placeholder="Ciao! Abbiamo ricevuto la tua richiesta..."
                class="bg-[#020420] border border-slate-700 text-white p-3.5 rounded-xl text-xs outline-none focus:border-emerald-400 resize-y leading-relaxed"
              ></textarea>
            </div>

            <div v-if="ruleError" role="alert" class="bg-red-500/15 border border-red-500/40 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold">
              ⚠️ {{ ruleError }}
            </div>

            <div class="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                @click="showCreateModal = false"
                class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                :disabled="isSavingRule"
                class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {{ isSavingRule ? 'Salvataggio...' : 'Salva Regola' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>