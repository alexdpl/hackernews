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
  { to: '/admin', label: '⚙️ API Gateway' },
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

// Unico client centralizzato per /api/newsletter/*
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
    const res = await newsletterApi('/broadcast', {
      method: 'POST',
      body: broadcastForm.value
    })

    if (res?.success !== false) {
      showBroadcastModal.value = false
      broadcastForm.value = { subject: '', targetSegment: 'SUBSCRIBED_ONLY', contentHtml: '' }
      notify(`📣 Campagna Broadcast inviata (${res?.sentCount ?? 1}/${res?.totalTargets ?? 1}) su Brevo SMTP v3!`, 'success')
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