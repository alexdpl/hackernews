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
  targetAddress: string
  triggerKeyword: string
  responseTemplate: string
  isActive: boolean
}

const adminNavItems = [
  { to: '/admin', label: '⚙️ API Gateway' },
  { to: '/admin/mail', label: '📧 Mail Center' },
  { to: '/admin/newsletter', label: '📣 Newsletter' },
  { to: '/admin/autoresponder', label: '📡 Autoresponder', active: true },
  { to: '/admin/crawler', label: '🤖 Crawler Engine' },
  { to: '/admin/blog', label: '📝 Gestione Blog' },
  { to: '/admin/nodes', label: '💬 Gestione Nodi' },
  { to: '/admin/shop', label: '🛍️ Gestione Shop' }
]

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

// Unico client centralizzato per /api/autoresponder/*
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
      notify(`✅ Regola su ${created.targetAddress} salvata nel Kernel Pure SQL!`, 'success')
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
    notify(`⚡ Regola #${rule.id} (${rule.targetAddress}) ${rule.isActive ? 'attivata' : 'disattivata'}.`, 'success')
  } catch {
    rule.isActive = prev
    notify(`⚠️ Errore aggiornamento stato regola #${rule.id} su Neon DB.`, 'error')
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
    notify(`🗑️ Regola "${rule.targetAddress}" rimossa.`, 'success')
  } catch {
    rules.value = backup
    notify('⚠️ Impossibile eliminare la regola dal server.', 'error')
  }
}

onMounted(() => {
  fetchRules()
})
</script>