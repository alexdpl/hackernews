<!-- app/pages/user/dashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpEditor from '~/components/blog/DkpEditor.vue'
import UserXpHistory from '~/components/UserXpHistory.vue'
import DkpPulseManager from '~/components/dashboard/DkpPulseManager.vue'
import DkpCommentsManager from '~/components/dashboard/DkpCommentsManager.vue'
import DKPnodesRichEditor from '~/components/DKPnodesRichEditor.vue'
import { buildCategoryNodeTree } from '~/composables/useDkpNodes'

useDkpSeo({
  title: 'Pannello Riservato Utente — DevKernelPulse v2.6-PURE-SQL',
  description: 'Gestisci il tuo profilo, gli articoli pubblicati, i certificati Proof of Code Vault e le tue API keys su DevKernelPulse v2.6-PURE-SQL.',
  noindex: true
})

const { data: allNodesRes } = useFetch<any>('/api/nodes', {
  server: false,
  lazy: true,
  transform: (res: any) => ({
    data: (res?.data || []).map((n: any) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      icon: n.icon,
      color: n.color,
      category: n.category,
      categoryId: n.categoryId ?? n.category_id,
      categoryName: n.categoryName ?? n.category_name
    }))
  })
})

const nodeTree = computed(() => buildCategoryNodeTree(allNodesRes.value?.data || []))
const editingThreadModal = ref<any>(null)
const isCreatingThreadModal = ref(false)

function openEditThread(thread: any) {
  editingThreadModal.value = {
    id: thread.id,
    title: thread.title,
    content: thread.content,
    nodeId: thread.nodeId || thread.node_id,
    nodeSlug: thread.nodeSlug || thread.node_slug,
    vaultHash: thread.vaultHash || thread.vault_hash,
    isPinned: Boolean(thread.isPinned || thread.is_pinned)
  }
}

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuthCore()
const { getMainUrl } = useDomain()

const resolvedUserId = computed(() => currentUser.value?.id || 1)
const isAdmin = computed(() => String(currentUser.value?.role || '').toUpperCase() === 'ADMIN')

const activeTab = computed({
  get: () => (route.query.tab as string) || 'profile',
  set: (val: string) => router.replace({ query: { ...route.query, tab: val } })
})

const contentTab = computed<'blog' | 'pulse' | 'nodes' | 'comments'>({
  get: () => {
    const sub = String(route.query.subtab || '').toLowerCase()
    if (sub === 'pulse' || sub === 'nodes' || sub === 'comments') {
      if (sub === 'nodes' && route.query.new === '1') {
        isCreatingThreadModal.value = true
      }
      return sub
    }
    return 'blog'
  },
  set: (val) => {
    router.replace({ query: { ...route.query, tab: 'content', subtab: val } })
  }
})

// --- STATI E PAGINAZIONE POST BLOG ---
const articles = ref<any[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// --- STATI, RICERCA E PAGINAZIONE THREAD NODES ---
const myThreads = ref<any[]>([])
const isLoadingThreads = ref(false)
const threadSearchQuery = ref('')
const threadNodeFilter = ref('all')
const threadCurrentPage = ref(1)
const threadsPerPage = 5

const availableThreadNodes = computed(() => {
  const seen = new Map<string, string>()
  for (const t of myThreads.value) {
    const slug = String(t.nodeSlug || t.node_slug || 'general')
    const label = String(t.nodeName || t.node_name || slug)
    if (!seen.has(slug)) seen.set(slug, label)
  }
  return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }))
})

const filteredAndPaginatedThreads = computed(() => {
  const q = threadSearchQuery.value.trim().toLowerCase()
  const nodeFilter = threadNodeFilter.value

  const filtered = myThreads.value.filter((t) => {
    const tNodeSlug = String(t.nodeSlug || t.node_slug || 'general')
    if (nodeFilter !== 'all' && tNodeSlug !== nodeFilter) return false

    if (!q) return true
    const title = String(t.title || '').toLowerCase()
    const content = String(t.content || '').toLowerCase()
    const nodeName = String(t.nodeName || t.node_name || tNodeSlug).toLowerCase()
    const vaultHash = String(t.vaultHash || t.vault_hash || '').toLowerCase()

    return (
      title.includes(q) ||
      content.includes(q) ||
      nodeName.includes(q) ||
      vaultHash.includes(q)
    )
  })

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / threadsPerPage))
  const safePage = Math.min(Math.max(1, threadCurrentPage.value), totalPages)
  const start = (safePage - 1) * threadsPerPage

  return {
    items: filtered.slice(start, start + threadsPerPage),
    totalItems,
    totalPages,
    currentPage: safePage,
    startIndex: totalItems === 0 ? 0 : start + 1,
    endIndex: Math.min(start + threadsPerPage, totalItems)
  }
})

watch([threadSearchQuery, threadNodeFilter], () => {
  threadCurrentPage.value = 1
})

async function fetchMyNodesThreads() {
  isLoadingThreads.value = true
  try {
    const res: any = await $fetch('/api/nodes/posts', {
      query: {
        author: 'me',
        authorId: resolvedUserId.value,
        sort: 'new',
        limit: 200
      }
    }).catch(() => null)
    myThreads.value = res?.data || res?.posts || (Array.isArray(res) ? res : [])
  } catch (err) {
    console.error('Errore caricamento thread:', err)
  } finally {
    isLoadingThreads.value = false
  }
}

async function deleteNodeThread(id: number) {
  if (!confirm('Eliminare permanentemente questo thread?')) return
  try {
    await $fetch(`/api/nodes/posts/${id}`, { method: 'DELETE' })
    myThreads.value = myThreads.value.filter(t => t.id !== id)
    if (threadCurrentPage.value > filteredAndPaginatedThreads.value.totalPages) {
      threadCurrentPage.value = filteredAndPaginatedThreads.value.totalPages
    }
    triggerToast('🗑️ Thread rimosso.')
  } catch (err: any) {
    console.error(err)
    triggerToast('❌ Errore durante l\'eliminazione.')
  }
}

const filteredAndPaginatedPosts = computed(() => {
  const filtered = articles.value.filter(post =>
    post.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (post.tags && post.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.value.toLowerCase())))
  )
  const start = (currentPage.value - 1) * itemsPerPage
  return {
    items: filtered.slice(start, start + itemsPerPage),
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / itemsPerPage) || 1
  }
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

function notifyXpUpdate() {
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dkp:xp_updated'))
  }
}

// ==========================================
// 1. PROOF OF CODE VAULT (Pure SQL)
// ==========================================
const vaultNewTitle = ref('')
const vaultNewCode = ref('')
const vaultCertificates = ref<any[]>([])
const isLoadingVault = ref(false)
const isNotarizingVault = ref(false)

async function fetchVaultCertificates() {
  isLoadingVault.value = true
  try {
    const res: any = await $fetch(`/api/user/vault?userId=${resolvedUserId.value}&_t=${Date.now()}`).catch(() => null)
    if (res && res.success) {
      vaultCertificates.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (err) {
    console.warn('[Dashboard Vault] Errore caricamento certificati:', err)
  } finally {
    isLoadingVault.value = false
  }
}

async function notarizeNewCode() {
  if (!vaultNewTitle.value.trim() || !vaultNewCode.value.trim()) {
    return triggerToast('❌ Inserisci titolo e codice sorgente.')
  }
  isNotarizingVault.value = true
  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: resolvedUserId.value,
        title: vaultNewTitle.value.trim(),
        code: vaultNewCode.value,
        sastStatus: 'PASSED'
      }
    })
    if (res && res.success) {
      triggerToast('🛡️ Codice notarizzato nel Vault Pure SQL! (+100 XP)')
      vaultNewTitle.value = ''
      vaultNewCode.value = ''
      notifyXpUpdate()
      await fetchVaultCertificates()
    } else {
      triggerToast('❌ Errore durante la notarizzazione.')
    }
  } catch {
    triggerToast('❌ Errore di connessione al Vault.')
  } finally {
    isNotarizingVault.value = false
  }
}

// ==========================================
// 2. DKP API CONSOLE & KEYS (Pure SQL)
// ==========================================
const apiKeysList = ref<any[]>([])
const isLoadingKeys = ref(false)
const isGeneratingKey = ref(false)
const newKeyName = ref('')
const newKeyRole = ref<'PRO' | 'FREE'>('PRO')
const generatedKeyModal = ref<string | null>(null)

async function fetchUserApiKeys() {
  isLoadingKeys.value = true
  try {
    const res: any = await $fetch(`/api/user/keys?userId=${resolvedUserId.value}&_t=${Date.now()}`).catch(() => null)
    const rawKeys = res?.data || res?.keys || (Array.isArray(res) ? res : [])
    apiKeysList.value = Array.isArray(rawKeys) ? rawKeys : []
  } catch (err) {
    console.warn('[Dashboard API Keys] Errore caricamento chiavi:', err)
  } finally {
    isLoadingKeys.value = false
  }
}

async function generateApiKey() {
  if (!newKeyName.value.trim()) return triggerToast('❌ Inserisci un nome per la API Key.')
  isGeneratingKey.value = true
  try {
    const res = await $fetch<any>('/api/user/keys/generate', {
      method: 'POST',
      body: {
        userId: resolvedUserId.value,
        name: newKeyName.value.trim(),
        role: newKeyRole.value
      }
    })
    if (res?.rawApiKey || res?.apiKey || res?.key) {
      generatedKeyModal.value = res.rawApiKey || res.apiKey || res.key
      newKeyName.value = ''
      triggerToast('🔑 Nuova API Key generata!')
      await fetchUserApiKeys()
    } else {
      triggerToast('❌ Risposta non valida dal server API Keys.')
    }
  } catch {
    triggerToast('❌ Errore generazione API Key.')
  } finally {
    isGeneratingKey.value = false
  }
}

async function revokeApiKey(keyId: string | number) {
  if (!confirm('Revocare definitivamente questa API Key? Le app che la usano smetteranno di autenticarsi.')) return
  try {
    await $fetch(`/api/user/keys/${keyId}`, { method: 'DELETE' }).catch(async () => {
      return await $fetch('/api/user/keys', { method: 'DELETE', query: { id: keyId, userId: resolvedUserId.value } })
    })
    apiKeysList.value = apiKeysList.value.filter(k => String(k.id) !== String(keyId))
    triggerToast('🗑️ API Key revocata.')
  } catch {
    triggerToast('❌ Impossibile revocare la API Key.')
  }
}

function copyToClipboard(text: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
  triggerToast('📋 Copiato negli appunti!')
}

// ==========================================
// 3. PROFILO UTENTE & XP
// ==========================================
const userProfileData = ref({
  username: currentUser.value?.username || 'alexdpl',
  avatar: currentUser.value?.avatar || 'https://github.com/alexdpl.png',
  xp: 10860,
  level: 'S-TIER ARCHITECT',
  badges: ['Developer VIP Member', 'Early Pioneer', 'Core Creator', 'Vault Master']
})

const avatarError = ref(false)
const userInitials = computed(() => {
  const name = currentUser.value?.username || userProfileData.value.username || 'DKP'
  return name.slice(0, 2).toUpperCase()
})

const xpHistoryList = ref<any[]>([])

const profileForm = ref({
  avatar: 'https://github.com/alexdpl.png',
  bio: 'Lead Engineer Architect & Core Creator of DevKernelPulse.',
  github: 'https://github.com/alexdpl',
  twitter: 'https://x.com/alexdpl76',
  linkedin: 'https://linkedin.com/in/alexdpl',
  reddit: 'https://reddit.com/user/alexdpl',
  discord: '',
  telegram: '',
  youtube: '',
  repository: '',
  website: '',
  customSocials: [] as Array<{ platform: string; label: string; url: string }>
})

const availableSocialOptions = [
  { id: 'google', label: 'Google', placeholder: 'https://g.dev/tuo-profilo', iconSlug: 'google', color: '#4285F4' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@tuocanale', iconSlug: 'youtube', color: '#FF0000' },
  { id: 'discord', label: 'Discord', placeholder: 'https://discord.gg/tuoinvito', iconSlug: 'discord', color: '#5865F2' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/tuoprofilo', iconSlug: 'facebook', color: '#1877F2' },
  { id: 'gitlab', label: 'GitLab', placeholder: 'https://gitlab.com/tuoprofilo', iconSlug: 'gitlab', color: '#FC6D26' },
  { id: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/tuocanale', iconSlug: 'twitch', color: '#9146FF' },
  { id: 'telegram', label: 'Telegram', placeholder: 'https://t.me/tuoprofilo', iconSlug: 'telegram', color: '#26A5E4' },
  { id: 'mastodon', label: 'Mastodon', placeholder: 'https://mastodon.social/@utente', iconSlug: 'mastodon', color: '#6364FF' },
  { id: 'threads', label: 'Threads', placeholder: 'https://threads.net/@utente', iconSlug: 'threads', color: '#FFFFFF' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/utente', iconSlug: 'instagram', color: '#E4405F' },
  { id: 'website', label: 'Sito Web / Portfolio', placeholder: 'https://tuosito.dev', iconSlug: 'googlechrome', color: '#00DC82' },
  { id: 'repository', label: 'Repository / Docs', placeholder: 'https://github.com/org/repo', iconSlug: 'git', color: '#38BDF8' }
]

const newSocialPlatform = ref('youtube')
const newSocialLabel = ref('')
const newSocialUrl = ref('')

function addCustomSocialLink() {
  const cleanUrl = newSocialUrl.value.trim()
  if (!cleanUrl) {
    return triggerToast('Inserisci un URL valido per il social da aggiungere.')
  }
  const opt = availableSocialOptions.find((o) => o.id === newSocialPlatform.value) || availableSocialOptions[0]
  const finalLabel = newSocialLabel.value.trim() || opt.label
  profileForm.value.customSocials.push({
    platform: opt.id,
    label: finalLabel,
    url: cleanUrl
  })
  newSocialLabel.value = ''
  newSocialUrl.value = ''
  triggerToast(`Link ${finalLabel} aggiunto! Clicca "Salva Modifiche nel Kernel" per renderlo pubblico.`)
}

function removeCustomSocialLink(index: number) {
  profileForm.value.customSocials.splice(index, 1)
}

async function fetchUserProfile() {
  try {
    const username = currentUser.value?.username || 'alexdpl'
    const res: any = await $fetch(`/api/user/profile?username=${username}&_t=${Date.now()}`)

    if (res?.success && res?.data?.user) {
      const u = res.data.user
      userProfileData.value.xp = u.xp ?? 10860
      userProfileData.value.level = u.rankTier || u.role || 'S-TIER ARCHITECT'
      if (u.badges?.length > 0) userProfileData.value.badges = u.badges
      if (u.avatar) {
        userProfileData.value.avatar = u.avatar
        profileForm.value.avatar = u.avatar
      }
      if (u.bio !== undefined) profileForm.value.bio = u.bio
      if (u.github) profileForm.value.github = u.github
      if (u.twitter) profileForm.value.twitter = u.twitter
      if (u.linkedin) profileForm.value.linkedin = u.linkedin
            if (u.reddit) profileForm.value.reddit = u.reddit
      if (u.discord || u.discordUrl) profileForm.value.discord = u.discord || u.discordUrl
      if (u.telegram || u.telegramUrl) profileForm.value.telegram = u.telegram || u.telegramUrl
      if (u.youtube || u.youtubeUrl) profileForm.value.youtube = u.youtube || u.youtubeUrl
      if (u.repository || u.repositoryUrl) profileForm.value.repository = u.repository || u.repositoryUrl
      if (u.website || u.websiteUrl) profileForm.value.website = u.website || u.websiteUrl
      if (Array.isArray(u.customSocials)) {
        profileForm.value.customSocials = u.customSocials.map((s: any) => ({
          platform: String(s.platform || 'website'),
          label: String(s.label || s.platform || 'Link'),
          url: String(s.url || '')
        }))
      }
    }

    const statsRes: any = await $fetch('/api/user/xp/history').catch(() => null)
    if (statsRes?.success && Array.isArray(statsRes.data)) {
      xpHistoryList.value = statsRes.data
    }
  } catch (err) {
    console.warn('Sincronizzazione dati profilo completata', err)
  }
}

const profileSaved = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)

function triggerFileSelect() {
  fileInputRef.value?.click()
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  if (file.size > 5 * 1024 * 1024) {
    return triggerToast('❌ Il file supera i 5MB.')
  }

  isUploadingAvatar.value = true
  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const res: any = await $fetch('/api/user/avatar', {
      method: 'POST',
      body: formData
    }).catch(async () => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = e => resolve({ success: true, url: e.target?.result as string })
        reader.readAsDataURL(file)
      })
    })

    if (res?.success && res?.url) {
      profileForm.value.avatar = res.url
      userProfileData.value.avatar = res.url
      avatarError.value = false
      triggerToast('📷 Avatar caricato! Clicca "Salva Modifiche" per confermare.')
    } else {
      triggerToast('❌ Errore durante l\'upload dell\'immagine.')
    }
  } catch {
    triggerToast('❌ Impossibile elaborare il file.')
  } finally {
    isUploadingAvatar.value = false
  }
}

async function saveProfile() {
  try {
    const payload = {
      username: currentUser.value?.username || 'alexdpl',
      ...profileForm.value
    }

    const res: any = await $fetch('/api/user/profile', {
      method: 'PUT',
      body: payload
    })

    if (res?.success) {
      profileSaved.value = true
      userProfileData.value.avatar = profileForm.value.avatar

      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('dkp:profile_updated'))
      }

      triggerToast('✅ Profilo salvato nel Kernel DKP!')
      setTimeout(() => {
        profileSaved.value = false
      }, 3000)
    } else {
      triggerToast('❌ Impossibile salvare le modifiche.')
    }
  } catch {
    triggerToast('❌ Errore durante il salvataggio sul server.')
  }
}

// ==========================================
// 4. ARTICOLI BLOG E MODALE EDITOR
// ==========================================
interface CategoryItem {
  id: string | number
  name: string
  icon: string
  subcategories: string[]
}
const availableCategories = ref<CategoryItem[]>([])

async function fetchCategories() {
  try {
    const res: any = await $fetch('/api/blog/categories').catch(() => null)
    const rawData = res && res.success ? res.data : Array.isArray(res) ? res : []
    if (rawData?.length > 0) {
      availableCategories.value = rawData.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '🏷️',
        subcategories: (c.subcategories || []).map((s: any) => (typeof s === 'string' ? s : s.name))
      }))
    } else {
      populateCategoriesFallback()
    }
  } catch {
    populateCategoriesFallback()
  }
}

function populateCategoriesFallback() {
  availableCategories.value = [
    { id: 'cat-1', name: 'AI, LLM & Machine Learning', icon: '🤖', subcategories: ['LLM Architecture', 'Local AI & Ollama'] },
    { id: 'cat-2', name: 'Cloud Native & DevOps', icon: '☁️', subcategories: ['Kubernetes', 'GCP Architecture'] },
    { id: 'cat-3', name: 'Cybersecurity & Vault', icon: '🛡️', subcategories: ['Penetration Testing', 'Vault & Hashing'] }
  ]
}

const isEditingArticle = ref(false)
const useAdvancedEditor = ref(false)

const articleForm = ref({
  id: null as number | null,
  title: '',
  category: '',
  subCategory: '',
  summary: '',
  content: '',
  tags: [] as string[],
  status: 'draft'
})

function openNewArticleModal() {
  const defaultCat = availableCategories.value.length > 0 ? availableCategories.value[0] : null
  articleForm.value = {
    id: null,
    title: '',
    category: defaultCat ? defaultCat.name : 'AI, LLM & Machine Learning',
    subCategory: defaultCat && defaultCat.subcategories.length > 0 ? defaultCat.subcategories[0] : '',
    summary: '',
    content: '',
    tags: [],
    status: 'draft'
  }
  useAdvancedEditor.value = false
  isEditingArticle.value = true
}

function editArticle(article: any) {
  articleForm.value = {
    id: article.id,
    title: article.title || '',
    category: article.category || '',
    subCategory: article.subCategory || '',
    summary: article.summary || '',
    content: article.content || '',
    tags: Array.isArray(article.tags) ? [...article.tags] : [],
    status: article.status || 'draft'
  }
  useAdvancedEditor.value = true
  isEditingArticle.value = true
}

function submitWithStatus(status: 'draft' | 'published') {
  articleForm.value.status = status
  saveArticle()
}

async function fetchUserArticles() {
  try {
    const res: any = await $fetch('/api/blog/posts').catch(() => null)
    const rawData = res && res.success ? res.data : Array.isArray(res) ? res : []
    if (rawData && rawData.length > 0) {
      articles.value = rawData.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.categoryName || p.category || 'AI, LLM & Machine Learning',
        subCategory: p.subCategory || '',
        summary: p.excerpt || p.summary || '',
        content: p.content || '',
        tags: p.tags || ['Nuxt4', 'PureSQL'],
        status: p.status || 'published',
        date: p.createdAt ? p.createdAt.split('T')[0] : '2026-11-12'
      }))
    } else {
      articles.value = [
        { id: 1, title: 'Guida all\'Architettura Nuxt 4 e Neon Pure SQL', category: 'Cloud Native & DevOps', tags: ['Nuxt4', 'PureSQL'], status: 'published', date: '2026-11-10', summary: 'Analisi approfondita.', content: 'Contenuto post' },
        { id: 2, title: 'Integrazione OpenUI Studio e Trinity AI', category: 'AI, LLM & Machine Learning', tags: ['AI', 'OpenUI'], status: 'draft', date: '2026-11-12', summary: 'Guida AI.', content: 'Contenuto post 2' }
      ]
    }
  } catch {
    articles.value = [
      { id: 1, title: 'Guida all\'Architettura Nuxt 4 e Neon Pure SQL', category: 'Cloud Native & DevOps', tags: ['Nuxt4', 'PureSQL'], status: 'published', date: '2026-11-10', summary: 'Analisi approfondita.', content: 'Contenuto post' }
    ]
  }
}

async function saveArticle() {
  if (!articleForm.value.title.trim() || !articleForm.value.category) {
    return triggerToast('❌ Compila Titolo e Categoria.')
  }

  const isUpdate = articleForm.value.id !== null
  const payload = {
    title: articleForm.value.title,
    category: articleForm.value.category,
    subCategory: articleForm.value.subCategory,
    excerpt: articleForm.value.summary,
    content: articleForm.value.content,
    tags: JSON.parse(JSON.stringify(articleForm.value.tags)),
    status: articleForm.value.status
  }

  try {
    const url = isUpdate ? `/api/blog/posts/${articleForm.value.id}` : '/api/blog/posts'
    const res: any = await $fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      body: payload
    })

    if (res && res.success) {
      triggerToast(isUpdate ? '✅ Articolo aggiornato sul DB!' : '🎉 Articolo pubblicato e notarizzato SHA-256!')
      await fetchUserArticles()
      isEditingArticle.value = false
    } else {
      triggerToast(`❌ ${res?.message || 'Errore salvataggio post.'}`)
    }
  } catch (err: any) {
    const serverMsg = err?.data?.statusMessage || err?.data?.message || err?.statusMessage || 'Errore durante il salvataggio sul server.'
    console.error('[Save Article Error]:', err)
    triggerToast(`❌ ${serverMsg}`)
  }
}

async function deleteArticle(id: number) {
  if (!confirm('Eliminare permanentemente questo articolo?')) return
  try {
    await $fetch(`/api/blog/posts/${id}`, { method: 'DELETE' }).catch(() => null)
    articles.value = articles.value.filter(a => a.id !== id)
    triggerToast('🗑️ Articolo rimosso.')
  } catch {}
}

async function activateEarlyPioneerBeta() {
  triggerToast('🎉 Registrato nel Beta Program!')
  if (!userProfileData.value.badges.includes('Early Pioneer')) {
    userProfileData.value.badges.push('Early Pioneer')
  }
}

watch(resolvedUserId, () => {
  fetchVaultCertificates()
  fetchUserApiKeys()
  fetchMyNodesThreads()
})

watch(activeTab, (tab) => {
  if (tab === 'vault') fetchVaultCertificates()
  if (tab === 'api') fetchUserApiKeys()
})

watch(contentTab, (tab) => {
  if (tab === 'nodes') fetchMyNodesThreads()
})

onMounted(() => {
  fetchCategories()
  fetchVaultCertificates()
  fetchUserApiKeys()
  fetchUserProfile()
  fetchUserArticles()
  fetchMyNodesThreads()
  window.addEventListener('dkp:xp_updated', fetchUserProfile)
})

onUnmounted(() => window.removeEventListener('dkp:xp_updated', fetchUserProfile))
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] text-[#f1f5f9] font-['Space_Grotesk',sans-serif] bg-grid-pattern relative px-4 sm:px-6 py-8 sm:py-12">
    
    <!-- Background Glows -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- NOTIFICA TOAST -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-4 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="-translate-y-4 opacity-0 scale-95"
    >
      <div v-if="showToast" class="fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs font-semibold bg-[#1e293b]/95 border-emerald-500/50 text-emerald-300">
        <span class="text-xl">⚡</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="relative z-10 max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- HEADER USER CARD -->
      <div class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden card-glow">
        <div class="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex items-center gap-5 relative z-10">
          <div class="relative shrink-0">
            <img
              v-if="profileForm.avatar && !avatarError"
              :src="profileForm.avatar"
              alt="Avatar Utente"
              @error="avatarError = true"
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#22d3ee]/40 p-0.5 bg-[#0f172a] object-cover shadow-[0_0_25px_rgba(34,211,238,0.2)]"
            />
            <div
              v-else
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#22d3ee]/40 bg-gradient-to-br from-cyan-500/20 to-violet-600/30 flex items-center justify-center text-[#22d3ee] font-black text-xl sm:text-2xl shadow-[0_0_25px_rgba(34,211,238,0.2)]"
            >
              {{ userInitials }}
            </div>
            
            <span class="absolute -bottom-1 -right-1 bg-emerald-500 text-[#0f172a] font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e293b] shadow" title="Utente Verificato DKP">
              ✓
            </span>
          </div>

          <div class="flex flex-col gap-1.5 font-mono">
            <h1 class="text-xl sm:text-3xl font-bold text-white tracking-tight font-display">
              Pannello Riservato <span class="text-[#22d3ee]">@{{ currentUser?.username || 'alexdpl' }}</span>
            </h1>
            <div class="flex flex-wrap gap-2">
              <span v-for="badge in userProfileData.badges" :key="badge" class="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                🛡️ {{ badge }}
              </span>
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                ⚡ {{ userProfileData.xp }} Punti DKP
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0 relative z-10 font-mono">
          <NuxtLink to="/user/ads" class="bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-cyan-500/20 transition-all text-center no-underline">
            📢 I Miei Link &amp; Ads
          </NuxtLink>
          <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="bg-[#0f172a] border border-[#22d3ee]/40 text-[#22d3ee] font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-[#22d3ee]/10 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] text-center no-underline">
            🌐 Profilo Pubblico
          </NuxtLink>
        </div>
      </div>

      <!-- TABS NAVIGATION BAR UNIFICATA (7 SEZIONI ALLINEATE) -->
      <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-[#1e293b]/80 p-2 border border-[#334155] rounded-2xl shadow-xl font-mono text-xs">
        <button class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center truncate" :class="activeTab === 'profile' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'" @click="activeTab = 'profile'">
          ⚙️ Profilo
        </button>
        <button class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center truncate" :class="activeTab === 'content' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'" @click="activeTab = 'content'">
          📰 Contenuti &amp; Commenti
        </button>
        <button class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center truncate" :class="activeTab === 'vault' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'" @click="activeTab = 'vault'">
          🛡️ Vault ({{ vaultCertificates.length }})
        </button>
        <button class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center truncate" :class="activeTab === 'api' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'" @click="activeTab = 'api'">
          🔑 API Console ({{ apiKeysList.length }})
        </button>
        <button class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center truncate" :class="activeTab === 'gamification' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'" @click="activeTab = 'gamification'">
          🏆 XP &amp; Livelli
        </button>
        <NuxtLink to="/user/ads" class="py-2.5 px-3 rounded-xl font-bold text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all text-center truncate no-underline">
          📢 I Miei Link &amp; Ads
        </NuxtLink>
        <NuxtLink to="/bounties" class="py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 transition-all text-center truncate no-underline">
          🎯 Bounties
        </NuxtLink>
      </nav>

      <!-- PANNELLO 1: PROFILO & SOCIAL -->
      <section v-if="activeTab === 'profile'" class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h2 class="text-xl font-bold text-white mb-1">Informazioni Developer</h2>
        <p class="text-[#64748b] text-xs sm:text-sm mb-6 font-mono">Personalizza l'aspetto del tuo profilo pubblico e collega i tuoi canali social su DKP v2.6-PURE-SQL.</p>

        <form @submit.prevent="saveProfile" class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-[#64748b] uppercase tracking-wider font-mono">Avatar Developer</label>
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <input
                v-model="profileForm.avatar"
                type="url"
                placeholder="https://... o carica un file dal PC"
                class="flex-1 w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-all font-mono"
              />
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileUpload"
              />
              <button
                type="button"
                @click="triggerFileSelect"
                :disabled="isUploadingAvatar"
                class="w-full sm:w-auto bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-bold text-xs px-4 py-3 rounded-xl hover:bg-cyan-500/20 transition-all cursor-pointer whitespace-nowrap font-mono shrink-0"
              >
                {{ isUploadingAvatar ? 'Caricamento...' : '💻 Carica da Desktop' }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-[#64748b] uppercase tracking-wider font-mono">Biografia Developer</label>
            <textarea v-model="profileForm.bio" rows="3" class="w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-all resize-none leading-relaxed font-sans"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-[#64748b] uppercase tracking-wider">Profilo GitHub</label>
              <input v-model="profileForm.github" type="url" class="w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-[#64748b] uppercase tracking-wider">Profilo X / Twitter</label>
              <input v-model="profileForm.twitter" type="url" class="w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-[#64748b] uppercase tracking-wider">Profilo LinkedIn</label>
              <input v-model="profileForm.linkedin" type="url" class="w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-[#64748b] uppercase tracking-wider">Profilo Reddit</label>
              <input v-model="profileForm.reddit" type="url" placeholder="https://reddit.com/user/username" class="w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-all" />
            </div>
          </div>

                    <!-- Social & Link Aggiuntivi Dinamici (YouTube, Discord, Facebook, Google, ecc.) -->
          <div class="pt-4 border-t border-[#334155] flex flex-col gap-4 font-mono">
            <div>
              <h3 class="text-sm font-bold text-white m-0">
                🌐 Social &amp; Link Extra Pubblici (YouTube, Discord, Facebook, Google, ecc.)
              </h3>
              <p class="text-[#64748b] text-xs mt-1 mb-0 font-sans">
                Scegli la piattaforma disponibile e aggiungi tutti i tuoi link personalizzati: compariranno con la loro icona CDN nel tuo profilo pubblico.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#0f172a] border border-[#334155] rounded-xl p-3.5">
              <div class="sm:col-span-3">
                <label class="block text-[10px] font-bold text-[#64748b] uppercase mb-1">Piattaforma</label>
                <select
                  v-model="newSocialPlatform"
                  class="w-full bg-[#1e293b] border border-[#334155] text-white px-3 py-2.5 rounded-xl text-xs outline-none focus:border-[#22d3ee]"
                >
                  <option v-for="opt in availableSocialOptions" :key="opt.id" :value="opt.id">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[10px] font-bold text-[#64748b] uppercase mb-1">Etichetta (opzionale)</label>
                <input
                  v-model="newSocialLabel"
                  type="text"
                  placeholder="Es. Canale YouTube"
                  class="w-full bg-[#1e293b] border border-[#334155] text-white px-3 py-2.5 rounded-xl text-xs outline-none focus:border-[#22d3ee] box-border"
                />
              </div>
              <div class="sm:col-span-4">
                <label class="block text-[10px] font-bold text-[#64748b] uppercase mb-1">URL Profilo / Canale</label>
                <input
                  v-model="newSocialUrl"
                  type="url"
                  placeholder="https://..."
                  class="w-full bg-[#1e293b] border border-[#334155] text-white px-3 py-2.5 rounded-xl text-xs outline-none focus:border-[#22d3ee] box-border"
                />
              </div>
              <div class="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  @click="addCustomSocialLink"
                  class="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer border-none transition-colors"
                >
                  + Aggiungi
                </button>
              </div>
            </div>

            <div v-if="profileForm.customSocials.length > 0" class="flex flex-col gap-2">
              <div
                v-for="(item, idx) in profileForm.customSocials"
                :key="idx"
                class="flex flex-wrap items-center justify-between gap-2 bg-[#0f172a] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <img
                    :src="`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${(availableSocialOptions.find(o => o.id === item.platform)?.iconSlug || 'google')}.svg`"
                    :alt="item.label"
                    class="w-4 h-4 shrink-0 invert opacity-90"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                  <span class="text-[#22d3ee] font-bold">{{ item.label }}</span>
                  <span class="text-slate-400 truncate">{{ item.url }}</span>
                </div>
                <button
                  type="button"
                  @click="removeCustomSocialLink(idx)"
                  class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold cursor-pointer"
                >
                  Rimuovi
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 mt-2">
            <button type="submit" class="bg-[#22d3ee] text-[#0f172a] font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all text-xs sm:text-sm cursor-pointer font-mono">
              Salva Modifiche nel Kernel
            </button>
            <span v-if="profileSaved" class="text-emerald-400 font-bold text-xs font-mono">✓ Profilo Aggiornato con Successo!</span>
          </div>
        </form>
      </section>

      <!-- PANNELLO 2: CONTENUTI & COMMENTI UNIFICATI -->
      <section v-if="activeTab === 'content'" class="flex flex-col gap-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#1e293b]/80 border border-[#334155] p-2 rounded-2xl shadow-xl font-mono text-xs">
          <button @click="contentTab = 'blog'" class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center" :class="contentTab === 'blog' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'">
            📝 Articoli Blog ({{ articles.length }})
          </button>
          <button @click="contentTab = 'pulse'" class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center" :class="contentTab === 'pulse' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'">
            🚀 Condivisioni (HN)
          </button>
          <button @click="contentTab = 'nodes'" class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center" :class="contentTab === 'nodes' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'">
            🌐 Forum (Nodes) ({{ myThreads.length }})
          </button>
          <button @click="contentTab = 'comments'" class="py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center" :class="contentTab === 'comments' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]'">
            💬 Commenti Unificati
          </button>
        </div>

        <!-- TAB BLOG -->
        <div v-if="contentTab === 'blog'" class="flex flex-col gap-6">
          <div class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 font-mono">
              <div>
                <h2 class="text-xl font-bold text-white font-display">Gestione Post &amp; Blog</h2>
                <p class="text-[#64748b] text-xs sm:text-sm mt-1">Crea e modifica i tuoi articoli pubblicati su DevKernelPulse.</p>
              </div>
              <div class="flex items-center gap-3 w-full sm:w-auto">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cerca per titolo..."
                  class="bg-[#0f172a] border border-[#334155] text-white p-2.5 rounded-xl text-xs w-full sm:w-64 outline-none focus:border-[#22d3ee]"
                />
                <button @click="openNewArticleModal" class="bg-[#22d3ee] text-[#0f172a] font-bold px-4 py-2.5 rounded-xl text-xs hover:brightness-110 transition-all whitespace-nowrap cursor-pointer">
                  + Nuovo Post
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs sm:text-sm font-mono">
                <thead>
                  <tr class="bg-[#0f172a] border-b border-[#334155] text-[#64748b] uppercase text-[10px]">
                    <th class="p-3">Titolo Articolo</th>
                    <th class="p-3">Categoria</th>
                    <th class="p-3">Stato</th>
                    <th class="p-3">Data</th>
                    <th class="p-3">Gestione</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#334155]/60 text-slate-300">
                  <tr v-if="filteredAndPaginatedPosts.items.length === 0">
                    <td colspan="5" class="text-center py-8 text-[#64748b] italic">
                      Nessun articolo trovato. Clicca su "+ Nuovo Post" per iniziare.
                    </td>
                  </tr>
                  <tr v-for="art in filteredAndPaginatedPosts.items" :key="art.id" class="hover:bg-[#0f172a]/40 transition-colors">
                    <td class="p-3 font-bold text-white font-display">{{ art.title }}</td>
                    <td class="p-3 text-[#22d3ee]">{{ art.category }}</td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" :class="art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'">
                        {{ art.status === 'published' ? 'Pubblicato' : 'Bozza' }}
                      </span>
                    </td>
                    <td class="p-3 text-[#64748b] text-xs">{{ art.date }}</td>
                    <td class="p-3">
                      <div class="flex gap-2">
                        <button @click="editArticle(art)" class="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer">✏️ Edit</button>
                        <button @click="deleteArticle(art.id)" class="bg-red-500/10 text-red-400 border border-red-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer">🗑️ Del</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB NODES (FORUM) CON RICERCA, FILTRO NODO, VAULT BADGE E PAGINAZIONE -->
        <div v-if="contentTab === 'nodes'" class="flex flex-col gap-6 font-mono">
          <div class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 class="text-xl font-bold text-white font-display m-0">I Miei Thread (DKP Nodes)</h2>
                <p class="text-[#64748b] text-xs sm:text-sm mt-1 font-sans">Gestisci, cerca, modifica ed elimina le discussioni notarizzate nella community.</p>
              </div>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <div class="relative flex-1 sm:w-64">
                  <input
                    v-model="threadSearchQuery"
                    type="text"
                    placeholder="🔍 Cerca thread, nodo o hash..."
                    class="w-full bg-[#0f172a] border border-[#334155] text-white p-2.5 pr-8 rounded-xl text-xs outline-none focus:border-[#22d3ee] transition-colors"
                  />
                  <button
                    v-if="threadSearchQuery"
                    type="button"
                    @click="threadSearchQuery = ''"
                    title="Pulisci ricerca"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white text-xs cursor-pointer bg-transparent border-none"
                  >
                    ✕
                  </button>
                </div>

                <select
                  v-model="threadNodeFilter"
                  class="bg-[#0f172a] border border-[#334155] text-purple-300 font-bold p-2.5 rounded-xl text-xs outline-none focus:border-[#22d3ee] cursor-pointer"
                >
                  <option value="all">Tutti i Nodi ({{ myThreads.length }})</option>
                  <option v-for="node in availableThreadNodes" :key="node.slug" :value="node.slug">
                    n/{{ node.name }}
                  </option>
                </select>

                <button
                  type="button"
                  @click="fetchMyNodesThreads"
                  class="bg-[#0f172a] hover:bg-cyan-500/15 text-[#22d3ee] border border-[#334155] px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  🔄 Aggiorna
                </button>

                <button
                  type="button"
                  @click="isCreatingThreadModal = true"
                  class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors border-none"
                >
                  ➕ Pubblica Thread
                </button>
              </div>
            </div>

            <div v-if="isLoadingThreads" class="text-center py-8 text-[#22d3ee] text-xs animate-pulse">
              ⚡ Caricamento thread dal Vault...
            </div>

            <div v-else-if="myThreads.length === 0" class="text-center py-10 text-[#64748b] text-xs italic bg-[#0f172a] border border-[#334155] rounded-xl">
              Non hai ancora pubblicato alcuna discussione nei DKP Nodi.
            </div>

            <div v-else-if="filteredAndPaginatedThreads.totalItems === 0" class="text-center py-10 text-[#64748b] text-xs bg-[#0f172a] border border-[#334155] rounded-xl flex flex-col items-center gap-3">
              <span>Nessun thread trovato per "<strong class="text-white">{{ threadSearchQuery }}</strong>".</span>
              <button
                type="button"
                @click="threadSearchQuery = ''; threadNodeFilter = 'all'"
                class="bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                Reimposta filtri
              </button>
            </div>

            <div v-else class="flex flex-col gap-4">
              <div class="overflow-x-auto bg-[#0f172a] border border-[#334155] rounded-xl">
                <table class="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr class="bg-[#1e293b] border-b border-[#334155] text-[#64748b] uppercase text-[10px]">
                      <th class="p-3.5">Titolo Discussione</th>
                      <th class="p-3.5">Nodo</th>
                      <th class="p-3.5">Vault On-Chain</th>
                      <th class="p-3.5">Karma</th>
                      <th class="p-3.5">Risposte</th>
                      <th class="p-3.5">Data</th>
                      <th class="p-3.5 text-right">Gestione</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#334155]/60 text-slate-300">
                    <tr v-for="t in filteredAndPaginatedThreads.items" :key="t.id" class="hover:bg-[#1e293b]/40 transition-colors">
                      <td class="p-3.5 font-bold text-white font-display max-w-xs sm:max-w-md">
                        <NuxtLink
                          :to="`/nodes/post/${t.id}`"
                          class="text-white hover:text-[#22d3ee] transition-colors no-underline line-clamp-2"
                        >
                          {{ t.title }}
                        </NuxtLink>
                      </td>
                      <td class="p-3.5 text-purple-400 font-bold whitespace-nowrap">
                        n/{{ t.nodeName || t.node_name || t.nodeSlug || 'general' }}
                      </td>
                      <td class="p-3.5 whitespace-nowrap">
                        <span
                          v-if="t.vaultHash || t.vault_hash"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold"
                          :title="`SHA-256: ${t.vaultHash || t.vault_hash}`"
                        >
                          ⛓️ #{{ t.vaultBlockNumber || t.vault_block_number || 'VERIFIED' }}
                        </span>
                        <span v-else class="text-[10px] text-[#64748b]">In attesa</span>
                      </td>
                      <td class="p-3.5 text-cyan-400 whitespace-nowrap">▲ {{ t.karmaScore || t.karma || 0 }}</td>
                      <td class="p-3.5 text-[#64748b] whitespace-nowrap">💬 {{ t.commentsCount || 0 }}</td>
                      <td class="p-3.5 text-[#64748b] text-xs whitespace-nowrap">{{ t.createdAt ? t.createdAt.split('T')[0] : 'Oggi' }}</td>
                      <td class="p-3.5 text-right whitespace-nowrap">
                        <div class="inline-flex gap-2">
                          <button type="button" @click="openEditThread(t)" class="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer hover:bg-cyan-500/20">
                            ✏️ Edit
                          </button>
                          <button type="button" @click="deleteNodeThread(t.id)" class="bg-red-500/10 text-red-400 border border-red-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer hover:bg-red-500/20">
                            🗑️ Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- BARRA PAGINAZIONE THREAD -->
              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-[#64748b]">
                <div>
                  Mostrando <span class="text-white font-bold">{{ filteredAndPaginatedThreads.startIndex }}–{{ filteredAndPaginatedThreads.endIndex }}</span>
                  di <span class="text-[#22d3ee] font-bold">{{ filteredAndPaginatedThreads.totalItems }}</span> thread
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    :disabled="filteredAndPaginatedThreads.currentPage <= 1"
                    @click="threadCurrentPage--"
                    class="px-3 py-1.5 rounded-xl bg-[#0f172a] border border-[#334155] text-slate-200 hover:border-[#22d3ee] disabled:opacity-40 disabled:pointer-events-none font-bold cursor-pointer transition-colors"
                  >
                    ← Precedente
                  </button>

                  <span class="px-3 py-1.5 rounded-xl bg-[#1e293b] border border-[#334155] text-[#22d3ee] font-bold">
                    Pagina {{ filteredAndPaginatedThreads.currentPage }} / {{ filteredAndPaginatedThreads.totalPages }}
                  </span>

                  <button
                    type="button"
                    :disabled="filteredAndPaginatedThreads.currentPage >= filteredAndPaginatedThreads.totalPages"
                    @click="threadCurrentPage++"
                    class="px-3 py-1.5 rounded-xl bg-[#0f172a] border border-[#334155] text-slate-200 hover:border-[#22d3ee] disabled:opacity-40 disabled:pointer-events-none font-bold cursor-pointer transition-colors"
                  >
                    Successiva →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB CONDIVISIONI HN -->
        <div v-if="contentTab === 'pulse'">
          <DkpPulseManager />
        </div>

        <!-- TAB COMMENTI UNIFICATI (HN / BLOG / FORUM) -->
        <div v-if="contentTab === 'comments'">
          <DkpCommentsManager
            :username="currentUser?.username || 'alexdpl'"
            :user-id="resolvedUserId"
            @toast="triggerToast"
          />
        </div>
      </section>

      <!-- PANNELLO 3: API CONSOLE -->
      <section v-if="activeTab === 'api'" class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-white font-display m-0">🔑 DKP API Console &amp; Token</h2>
            <p class="text-[#64748b] text-xs mt-1 font-sans">Genera e gestisci le chiavi di autenticazione per DKP Gateway, OpenUI Studio e CLI Toolkit.</p>
          </div>
          <span class="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto">
            {{ apiKeysList.length }} Chiavi Attive
          </span>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="newKeyName"
            type="text"
            placeholder="Nome Token (es. App Produzione, OpenUI Studio...)"
            @keyup.enter="generateApiKey"
            class="flex-1 bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm outline-none focus:border-[#22d3ee]"
          />
          <select
            v-model="newKeyRole"
            class="bg-[#0f172a] border border-[#334155] text-cyan-400 font-bold p-3 rounded-xl text-xs outline-none focus:border-[#22d3ee] cursor-pointer"
          >
            <option value="PRO">TIER: PRO</option>
            <option value="FREE">TIER: FREE</option>
          </select>
          <button
            type="button"
            @click="generateApiKey"
            :disabled="isGeneratingKey"
            class="bg-[#22d3ee] text-[#0f172a] font-bold px-6 py-3 rounded-xl text-xs sm:text-sm cursor-pointer whitespace-nowrap hover:brightness-110 transition-all disabled:opacity-50"
          >
            {{ isGeneratingKey ? 'Generazione...' : 'Genera API Key' }}
          </button>
        </div>

        <div v-if="generatedKeyModal" class="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-amber-400 text-xs font-bold m-0">⚠️ Copia la tua API Key ora:</p>
            <button type="button" @click="generatedKeyModal = null" class="text-[#64748b] hover:text-white text-xs cursor-pointer">✕</button>
          </div>
          <div class="flex items-center justify-between bg-[#0f172a] border border-[#334155] p-3 rounded-xl gap-4">
            <code class="text-cyan-400 text-xs sm:text-sm truncate">{{ generatedKeyModal }}</code>
            <button type="button" @click="copyToClipboard(generatedKeyModal)" class="bg-[#22d3ee] text-[#0f172a] font-bold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer shrink-0">
              📋 Copia
            </button>
          </div>
        </div>

        <div class="border-t border-[#334155] pt-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#64748b] m-0">Chiavi Registrate su Neon Pure SQL</h3>
            <button type="button" @click="fetchUserApiKeys" class="text-xs text-cyan-400 hover:text-white cursor-pointer">
              🔄 Aggiorna
            </button>
          </div>

          <div v-if="isLoadingKeys" class="text-center py-6 text-[#64748b] text-xs">Caricamento API Keys...</div>
          <div v-else-if="apiKeysList.length === 0" class="bg-[#0f172a] border border-[#334155] rounded-2xl p-6 text-center text-[#64748b] text-xs">Nessuna API Key attiva.</div>

          <div v-else class="overflow-x-auto bg-[#0f172a] border border-[#334155] rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#1e293b] border-b border-[#334155] text-[#64748b] uppercase text-[10px]">
                  <th class="p-3.5">Nome Token</th>
                  <th class="p-3.5">Chiave / Prefisso</th>
                  <th class="p-3.5">Tier</th>
                  <th class="p-3.5">Utilizzo</th>
                  <th class="p-3.5">Creata il</th>
                  <th class="p-3.5 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#334155]/60 text-slate-300">
                <tr v-for="k in apiKeysList" :key="k.id" class="hover:bg-[#1e293b]/40 transition-colors">
                  <td class="p-3.5 font-bold text-white font-display">{{ k.name || 'DKP Key' }}</td>
                  <td class="p-3.5">
                    <code class="text-cyan-400 bg-[#1e293b] px-2.5 py-1 rounded border border-[#334155]">
                      {{ k.keyPrefix || k.prefix || 'dkp_live_' }}
                    </code>
                  </td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {{ k.role || 'PRO' }}
                    </span>
                  </td>
                  <td class="p-3.5 text-[#64748b]">{{ k.requestsCount || 0 }} req</td>
                  <td class="p-3.5 text-[#64748b]">{{ k.createdAt ? new Date(k.createdAt).toLocaleDateString('it-IT') : 'Attiva' }}</td>
                  <td class="p-3.5 text-right">
                    <button type="button" @click="revokeApiKey(k.id)" class="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-red-500/20 cursor-pointer">
                      🗑️ Revoca
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- PANNELLO 4: VAULT -->
      <section v-if="activeTab === 'vault'" class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-white font-display m-0">Proof of Code Vault</h2>
            <p class="text-[#64748b] text-xs mt-1 font-sans">Notarizza sorgenti con impronta SHA-256 immutabile.</p>
          </div>
          <span class="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto">
            🛡️ {{ vaultCertificates.length }} Certificati
          </span>
        </div>

        <div class="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-6 flex flex-col gap-4">
          <input v-model="vaultNewTitle" type="text" placeholder="Titolo Script..." class="bg-[#1e293b] border border-[#334155] text-white p-3 rounded-xl text-sm outline-none focus:border-[#22d3ee]" />
          <textarea v-model="vaultNewCode" rows="4" placeholder="Codice da firmare..." class="bg-[#1e293b] border border-[#334155] text-cyan-300 p-3 rounded-xl text-xs outline-none resize-none focus:border-[#22d3ee]"></textarea>
          <button type="button" @click="notarizeNewCode" :disabled="isNotarizingVault" class="bg-[#22d3ee] text-[#0f172a] font-bold px-5 py-3 rounded-xl text-sm cursor-pointer hover:brightness-110 transition-all disabled:opacity-50">
            {{ isNotarizingVault ? '⏳ Firma SHA-256 in corso...' : '🛡️ Notarizza nel Vault' }}
          </button>
        </div>

        <div class="border-t border-[#334155] pt-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#64748b] m-0">Certificati Crittografici Registrati</h3>
            <button type="button" @click="fetchVaultCertificates" class="text-xs text-cyan-400 hover:text-white cursor-pointer">🔄 Aggiorna</button>
          </div>

          <div v-if="isLoadingVault" class="text-center py-6 text-[#64748b] text-xs">Caricamento certificati...</div>
          <div v-else-if="vaultCertificates.length === 0" class="bg-[#0f172a] border border-[#334155] rounded-2xl p-6 text-center text-[#64748b] text-xs">Nessun certificato presente.</div>

          <div v-else class="grid grid-cols-1 gap-4">
            <div v-for="cert in vaultCertificates" :key="cert.id" class="bg-[#0f172a] border border-[#334155] hover:border-cyan-500/40 rounded-xl p-5 flex flex-col gap-3 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase">PASSED</span>
                  <h4 class="text-white font-bold text-sm font-display m-0">{{ cert.title }}</h4>
                </div>
                <span class="text-[11px] text-[#64748b]">ID #{{ cert.id }}</span>
              </div>
              <div class="flex items-center justify-between gap-2 bg-[#1e293b] border border-[#334155] p-3 rounded-xl">
                <code class="text-cyan-400 text-xs break-all">SHA-256: {{ cert.hash }}</code>
                <button type="button" @click="copyToClipboard(cert.hash)" class="bg-[#0f172a] hover:bg-cyan-500/15 text-cyan-300 border border-[#334155] px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer shrink-0">📋 Copia</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PANNELLO 5: GAMIFICATION -->
      <section v-if="activeTab === 'gamification'" class="bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex justify-between items-center border-b border-[#334155] pb-6">
          <h2 class="text-xl sm:text-2xl font-bold text-white font-display">Gamification Center</h2>
          <span class="text-2xl font-bold text-cyan-400">{{ userProfileData.xp }} XP</span>
        </div>
        <button @click="activateEarlyPioneerBeta" class="bg-[#22d3ee] text-[#0f172a] font-bold px-6 py-3 rounded-xl text-sm cursor-pointer hover:brightness-110 transition-all self-start">⚡ Attiva Status "Early Pioneer"</button>
        <UserXpHistory :history="xpHistoryList" />
      </section>

    </div>

    <!-- MODALE EDITOR ARTICOLO BLOG -->
    <div v-if="isEditingArticle" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono" @click.self="isEditingArticle = false">
      <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 sm:p-8 w-full max-w-3xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex justify-between items-center border-b border-[#334155] pb-4">
          <h3 class="text-xl font-bold text-white font-display">✏️ Editor Post Blog DKP</h3>
          <button type="button" @click="useAdvancedEditor = !useAdvancedEditor" class="bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer">
            {{ useAdvancedEditor ? '⬅️ Standard' : '✨ Avanzato' }}
          </button>
        </div>
        
        <div v-if="useAdvancedEditor">
          <DkpEditor :modelValue="articleForm" @update:modelValue="articleForm = { ...articleForm, ...$event }" />
        </div>
        
        <div v-else class="flex flex-col gap-4">
          <input v-model="articleForm.title" type="text" class="bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm outline-none focus:border-[#22d3ee]" placeholder="Titolo post..." />
          <select v-model="articleForm.category" class="bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm outline-none focus:border-[#22d3ee]">
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.name">{{ cat.icon }} {{ cat.name }}</option>
          </select>
          <textarea v-model="articleForm.summary" rows="3" class="bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm outline-none resize-none font-sans" placeholder="Breve estratto (Summary)..."></textarea>
          <textarea v-model="articleForm.content" rows="6" class="bg-[#0f172a] border border-[#334155] text-white p-3 rounded-xl text-sm outline-none font-mono" placeholder="Contenuto dell'articolo (supporta Markdown)..."></textarea>
        </div>

        <div class="flex justify-end gap-3 border-t border-[#334155] pt-4">
          <button type="button" @click="isEditingArticle = false" class="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">Annulla</button>
          <button type="button" @click="submitWithStatus('draft')" class="bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">Salva in Bozza</button>
          <button type="button" @click="submitWithStatus('published')" class="bg-[#22d3ee] text-[#0f172a] font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:brightness-110">Pubblica Ora</button>
        </div>
      </div>
    </div>

    <!-- MODALE UNIFICATA DKP NODES RICH EDITOR -->
    <DKPnodesRichEditor
      :is-open="Boolean(editingThreadModal) || isCreatingThreadModal"
      :categories="nodeTree.categories"
      :grouped-nodes="nodeTree.groupedNodes"
      :edit-post="editingThreadModal"
      :is-admin="isAdmin"
      @close="() => { editingThreadModal = null; isCreatingThreadModal = false }"
      @published="async () => { isCreatingThreadModal = false; await fetchMyNodesThreads(); triggerToast('✅ Thread pubblicato e notarizzato con successo!') }"
      @updated="async () => { editingThreadModal = null; isCreatingThreadModal = false; await fetchMyNodesThreads(); triggerToast('✅ Thread aggiornato con successo!') }"
    />

  </div>
</template>

<style scoped>
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
.card-glow {
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.card-glow:hover {
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>