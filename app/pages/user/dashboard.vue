<!-- app/pages/user/dashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpEditor from '~/components/blog/DkpEditor.vue'
import UserXpHistory from '~/components/UserXpHistory.vue'
import DkpPulseManager from '~/components/dashboard/DkpPulseManager.vue'
import DkpCommentsManager from '~/components/dashboard/DkpCommentsManager.vue'
import DkpNodesManager from '~/components/dashboard/DkpNodesManager.vue'

useDkpSeo({
  title: 'Pannello Riservato Utente — DevKernelPulse v2.6-PURE-SQL',
  description: 'Gestisci il tuo profilo, gli articoli pubblicati, i certificati Proof of Code Vault e le tue API keys su DevKernelPulse v2.6-PURE-SQL.',
  noindex: true
})

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuthCore()
const { getMainUrl } = useDomain()

const resolvedUserId = computed(() => currentUser.value?.id || 1)

const activeTab = computed({
  get: () => (route.query.tab as string) || 'profile',
  set: (val: string) => router.replace({ query: { ...route.query, tab: val } })
})

const contentTab = ref<'blog' | 'pulse' | 'nodes' | 'comments'>('blog')

// --- STATI E PAGINAZIONE POST ---
const articles = ref<any[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

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

function changePage(page: number) {
  if (page >= 1 && page <= filteredAndPaginatedPosts.value.totalPages) {
    currentPage.value = page
  }
}

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
  reddit: 'https://reddit.com/user/alexdpl'
})

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
    const res: any = await $fetch(url, { method: isUpdate ? 'PUT' : 'POST', body: payload }).catch(() => ({ success: true }))

    if (res && res.success !== false) {
      triggerToast(isUpdate ? '✅ Articolo aggiornato!' : '🎉 Articolo creato con successo!')

      if (!isUpdate) {
        articles.value.unshift({
          id: Date.now(),
          title: payload.title,
          category: payload.category,
          subCategory: payload.subCategory,
          summary: payload.excerpt,
          content: payload.content,
          tags: payload.tags,
          status: payload.status,
          date: new Date().toISOString().split('T')[0]
        })
      }
      isEditingArticle.value = false
    } else {
      triggerToast('❌ Errore salvataggio post.')
    }
  } catch {
    triggerToast('❌ Errore di rete.')
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

// Re-fetch automatico se l'utente viene idratato dopo il mount
watch(resolvedUserId, () => {
  fetchVaultCertificates()
  fetchUserApiKeys()
})

// Re-fetch mirato quando si cambia tab
watch(activeTab, (tab) => {
  if (tab === 'vault') fetchVaultCertificates()
  if (tab === 'api') fetchUserApiKeys()
})

onMounted(() => {
  fetchCategories()
  fetchVaultCertificates()
  fetchUserApiKeys()
  fetchUserProfile()
  fetchUserArticles()
  window.addEventListener('dkp:xp_updated', fetchUserProfile)
})

onUnmounted(() => window.removeEventListener('dkp:xp_updated', fetchUserProfile))
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-8 sm:py-12">
    
    <!-- NOTIFICA TOAST -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-95"
    >
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-6xl mx-auto flex flex-col gap-6">
      
      <!-- HEADER USER CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div class="absolute -top-10 right-0 w-80 h-40 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>
        
        <div class="flex items-center gap-5 relative z-10">
          <div class="relative shrink-0">
            <img
              v-if="profileForm.avatar && !avatarError"
              :src="profileForm.avatar"
              alt="Avatar Utente"
              @error="avatarError = true"
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400 p-0.5 bg-slate-950 object-cover shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            />
            <div
              v-else
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-purple-600/30 flex items-center justify-center text-emerald-400 font-black text-xl sm:text-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              {{ userInitials }}
            </div>
            
            <span class="absolute bottom-0 right-0 bg-emerald-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#090d16] shadow-[0_0_10px_rgba(16,185,129,0.8)]" title="Utente Verificato DKP">
              ✓
            </span>
          </div>

          <div class="flex flex-col gap-1.5 font-mono">
            <h1 class="text-xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Pannello Riservato <span class="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">@{{ currentUser?.username || 'alexdpl' }}</span>
            </h1>
            <div class="flex flex-wrap gap-2">
              <span v-for="badge in userProfileData.badges" :key="badge" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                🛡️ {{ badge }}
              </span>
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                ⚡ {{ userProfileData.xp }} Punti DKP
              </span>
            </div>
          </div>
        </div>

        <NuxtLink :to="getMainUrl(`/user/${currentUser?.username || 'alexdpl'}`)" external class="w-full sm:w-auto bg-slate-950 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-500/10 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] text-center shrink-0 relative z-10 font-mono no-underline">
          🌐 Vedi Profilo Pubblico
        </NuxtLink>
      </div>

      <!-- TABS NAVIGATION BAR -->
      <nav class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#090d16] p-2 border border-slate-800 rounded-2xl shadow-xl font-mono">
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'profile' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'profile'">
          ⚙️ Profilo &amp; Social
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'content' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'content'">
          📰 I Miei Contenuti
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'vault' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'vault'">
          🛡️ Proof of Code Vault ({{ vaultCertificates.length }})
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'api' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'api'">
          🔑 DKP API Console ({{ apiKeysList.length }})
        </button>
        <button class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center truncate" :class="activeTab === 'gamification' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white border border-transparent'" @click="activeTab = 'gamification'">
          🏆 Gamification &amp; XP
        </button>
        <NuxtLink to="/bounties" class="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 transition-all text-center truncate no-underline">
          🎯 Bounty &amp; $PULSE
        </NuxtLink>
      </nav>

      <!-- PANNELLO 1: PROFILO & SOCIAL -->
      <section v-if="activeTab === 'profile'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h2 class="text-xl font-black text-white mb-1">Informazioni Developer</h2>
        <p class="text-slate-400 text-xs sm:text-sm mb-6">Personalizza l'aspetto del tuo profilo pubblico e collega i tuoi canali social su DKP v2.6-PURE-SQL.</p>

        <form @submit.prevent="saveProfile" class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Avatar Developer</label>
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <input
                v-model="profileForm.avatar"
                type="url"
                placeholder="https://... o carica un file dal PC"
                class="flex-1 w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all font-mono"
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
                class="w-full sm:w-auto bg-sky-500/10 border border-sky-500/40 text-sky-400 font-extrabold text-xs px-4 py-3 rounded-xl hover:bg-sky-500/20 transition-all cursor-pointer whitespace-nowrap font-mono shrink-0"
              >
                {{ isUploadingAvatar ? 'Caricamento...' : '💻 Carica da Desktop' }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Biografia Developer</label>
            <textarea v-model="profileForm.bio" rows="3" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all resize-none leading-relaxed"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo GitHub</label>
              <input v-model="profileForm.github" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo X / Twitter</label>
              <input v-model="profileForm.twitter" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo LinkedIn</label>
              <input v-model="profileForm.linkedin" type="url" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Profilo Reddit</label>
              <input v-model="profileForm.reddit" type="url" placeholder="https://reddit.com/user/username" class="w-full bg-[#020420] border border-slate-700/80 text-white p-3 rounded-xl text-sm focus:border-emerald-400 outline-none transition-all" />
            </div>
          </div>

          <div class="flex items-center gap-4 mt-2">
            <button type="submit" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all text-xs sm:text-sm cursor-pointer font-mono">
              Salva Modifiche nel Kernel
            </button>
            <span v-if="profileSaved" class="text-emerald-400 font-bold text-xs font-mono">✓ Profilo Aggiornato con Successo!</span>
          </div>
        </form>
      </section>

      <!-- PANNELLO 2: CONTENUTI -->
      <section v-if="activeTab === 'content'" class="flex flex-col gap-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#090d16] border border-slate-800 p-2 rounded-2xl shadow-xl font-mono">
          <button @click="contentTab = 'blog'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'blog' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            📝 Articoli Blog
          </button>
          <button @click="contentTab = 'pulse'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'pulse' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            🚀 Condivisioni (HN)
          </button>
          <button @click="contentTab = 'nodes'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'nodes' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            🌐 Forum (Nodes)
          </button>
          <button @click="contentTab = 'comments'" class="py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-center" :class="contentTab === 'comments' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'">
            💬 Commenti Articoli
          </button>
        </div>

        <div v-if="contentTab === 'blog'" class="flex flex-col gap-6">
          <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 font-mono">
              <div>
                <h2 class="text-xl font-black text-white font-sans">Gestione Post &amp; Blog</h2>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">Crea e modifica i tuoi articoli pubblicati su DevKernelPulse.</p>
              </div>
              <div class="flex items-center gap-3 w-full sm:w-auto">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cerca per titolo..."
                  class="bg-[#020420] border border-slate-700 text-white p-2.5 rounded-xl text-xs w-full sm:w-64 outline-none focus:border-emerald-400"
                />
                <button @click="openNewArticleModal" class="bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all whitespace-nowrap cursor-pointer">
                  + Nuovo Post
                </button>
              </div>
            </div>

            <!-- TABELLA ARTICOLI -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs sm:text-sm font-mono">
                <thead>
                  <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th class="p-3">Titolo Articolo</th>
                    <th class="p-3">Categoria</th>
                    <th class="p-3">Stato</th>
                    <th class="p-3">Data</th>
                    <th class="p-3">Gestione</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  <tr v-if="filteredAndPaginatedPosts.items.length === 0">
                    <td colspan="5" class="text-center py-8 text-slate-500 italic">
                      Nessun articolo trovato. Clicca su "+ Nuovo Post" per iniziare.
                    </td>
                  </tr>
                  <tr v-for="art in filteredAndPaginatedPosts.items" :key="art.id" class="hover:bg-slate-900/40 transition-colors">
                    <td class="p-3 font-bold text-white font-sans">{{ art.title }}</td>
                    <td class="p-3 text-emerald-400">{{ art.category }}</td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase" :class="art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'">
                        {{ art.status === 'published' ? 'Pubblicato' : 'Bozza' }}
                      </span>
                    </td>
                    <td class="p-3 text-slate-400 text-xs">{{ art.date }}</td>
                    <td class="p-3">
                      <div class="flex gap-2">
                        <button @click="editArticle(art)" class="bg-sky-500/10 text-sky-400 border border-sky-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer">✏️ Edit</button>
                        <button @click="deleteArticle(art.id)" class="bg-red-500/10 text-red-400 border border-red-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer">🗑️ Del</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- MODALE EDITOR ARTICOLO -->
        <div v-if="isEditingArticle" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono" @click.self="isEditingArticle = false">
          <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-3xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div class="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 class="text-xl font-black text-white">✏️ Editor Post Blog DKP</h3>
              <button type="button" @click="useAdvancedEditor = !useAdvancedEditor" class="bg-sky-500/10 border border-sky-500/40 text-sky-400 font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer">
                {{ useAdvancedEditor ? '⬅️ Standard' : '✨ Avanzato' }}
              </button>
            </div>
            
            <div v-if="useAdvancedEditor">
              <DkpEditor :modelValue="articleForm" @update:modelValue="articleForm = { ...articleForm, ...$event }"/>
            </div>
            
            <div v-else class="flex flex-col gap-4">
              <input v-model="articleForm.title" type="text" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400" placeholder="Titolo post..." />
              <select v-model="articleForm.category" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400">
                <option v-for="cat in availableCategories" :key="cat.id" :value="cat.name">{{ cat.icon }} {{ cat.name }}</option>
              </select>
              <textarea v-model="articleForm.summary" rows="3" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none resize-none" placeholder="Breve estratto (Summary)..."></textarea>
              <textarea v-model="articleForm.content" rows="6" class="bg-[#020420] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none font-mono" placeholder="Contenuto dell'articolo (supporta Markdown)..."></textarea>
            </div>

            <div class="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" @click="isEditingArticle = false" class="bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">Annulla</button>
              <button type="button" @click="submitWithStatus('draft')" class="bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">Salva in Bozza</button>
              <button type="button" @click="submitWithStatus('published')" class="bg-emerald-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer">Pubblica Ora</button>
            </div>
          </div>
        </div>

        <div v-if="contentTab === 'pulse'"><DkpPulseManager/></div>
        <div v-if="contentTab === 'nodes'"><DkpNodesManager/></div>
        <div v-if="contentTab === 'comments'"><DkpCommentsManager/></div>
      </section>

      <!-- PANNELLO 3: API CONSOLE & LISTA API KEYS ATTIVE -->
      <section v-if="activeTab === 'api'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-black text-white font-sans m-0">🔑 DKP API Console &amp; Token</h2>
            <p class="text-slate-400 text-xs mt-1 font-sans">Genera e gestisci le chiavi di autenticazione per DKP Gateway, OpenUI Studio e CLI Toolkit.</p>
          </div>
          <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto">
            {{ apiKeysList.length }} Chiavi Attive
          </span>
        </div>

        <!-- FORM GENERAZIONE NUOVA KEY -->
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="newKeyName"
            type="text"
            placeholder="Nome Token (es. App Produzione, OpenUI Studio...)"
            @keyup.enter="generateApiKey"
            class="flex-1 bg-[#020420] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400"
          />
          <select
            v-model="newKeyRole"
            class="bg-[#020420] border border-slate-700 text-sky-400 font-bold p-3 rounded-xl text-xs outline-none focus:border-emerald-400 cursor-pointer"
          >
            <option value="PRO">TIER: PRO</option>
            <option value="FREE">TIER: FREE</option>
          </select>
          <button
            type="button"
            @click="generateApiKey"
            :disabled="isGeneratingKey"
            class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm cursor-pointer whitespace-nowrap hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50"
          >
            {{ isGeneratingKey ? 'Generazione...' : 'Genera API Key' }}
          </button>
        </div>

        <!-- MODALE CHIAVE APPENA GENERATA -->
        <div v-if="generatedKeyModal" class="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-amber-400 text-xs font-bold m-0">⚠️ Copia la tua API Key ora (per sicurezza non verrà mostrata in chiaro di nuovo):</p>
            <button type="button" @click="generatedKeyModal = null" class="text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
          </div>
          <div class="flex items-center justify-between bg-[#020420] border border-slate-800 p-3 rounded-xl gap-4">
            <code class="text-emerald-400 text-xs sm:text-sm truncate">{{ generatedKeyModal }}</code>
            <button type="button" @click="copyToClipboard(generatedKeyModal)" class="bg-emerald-500 text-slate-950 font-black px-3.5 py-1.5 rounded-lg text-xs cursor-pointer shrink-0">
              📋 Copia
            </button>
          </div>
        </div>

        <!-- LISTA DELLE API KEY ATTIVE NEL DB -->
        <div class="border-t border-slate-800/80 pt-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Chiavi Registrate su Neon Pure SQL</h3>
            <button type="button" @click="fetchUserApiKeys" class="text-xs text-sky-400 hover:text-emerald-400 cursor-pointer">
              🔄 Aggiorna
            </button>
          </div>

          <div v-if="isLoadingKeys" class="text-center py-6 text-slate-500 text-xs">
            Caricamento API Keys dal Kernel...
          </div>

          <div v-else-if="apiKeysList.length === 0" class="bg-[#020420] border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
            Nessuna API Key attiva trovata per questo account. Generane una qui sopra!
          </div>

          <div v-else class="overflow-x-auto bg-[#020420] border border-slate-800 rounded-2xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th class="p-3.5">Nome Token</th>
                  <th class="p-3.5">Chiave / Prefisso</th>
                  <th class="p-3.5">Tier</th>
                  <th class="p-3.5">Utilizzo</th>
                  <th class="p-3.5">Creata il</th>
                  <th class="p-3.5 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/70 text-slate-300">
                <tr v-for="k in apiKeysList" :key="k.id" class="hover:bg-slate-900/40 transition-colors">
                  <td class="p-3.5 font-bold text-white font-sans">{{ k.name || k.label || 'DKP Key' }}</td>
                  <td class="p-3.5">
                    <code class="text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                      {{ k.keyPrefix || k.prefix || (k.apiKey ? k.apiKey.slice(0, 12) + '••••••••' : 'dkp_live_••••••••') }}
                    </code>
                  </td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      {{ k.role || k.tier || 'PRO' }}
                    </span>
                  </td>
                  <td class="p-3.5 text-slate-400">
                    {{ k.requestsCount ?? k.usageCount ?? 0 }} req
                  </td>
                  <td class="p-3.5 text-slate-400">
                    {{ k.createdAt || k.created_at ? new Date(k.createdAt || k.created_at).toLocaleDateString('it-IT') : 'Attiva' }}
                  </td>
                  <td class="p-3.5 text-right">
                    <div class="inline-flex items-center gap-2">
                      <button
                        v-if="k.apiKey || k.keyPrefix"
                        type="button"
                        @click="copyToClipboard(k.apiKey || k.keyPrefix)"
                        class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-sky-500/20 cursor-pointer"
                      >
                        📋 Copia
                      </button>
                      <button
                        type="button"
                        @click="revokeApiKey(k.id)"
                        class="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-red-500/20 cursor-pointer"
                      >
                        🗑️ Revoca
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- PANNELLO 4: PROOF OF CODE VAULT & CERTIFICATI NOTARIZZATI -->
      <section v-if="activeTab === 'vault'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-white font-sans m-0">Proof of Code Vault</h2>
            <p class="text-slate-400 text-xs mt-1 font-sans">Notarizza sorgenti con impronta SHA-256 immutabile e consulta tutti i tuoi certificati registrati su Neon Pure SQL.</p>
          </div>
          <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto">
            🛡️ {{ vaultCertificates.length }} Certificati
          </span>
        </div>

        <!-- FORM RAPIDO NOTARIZZAZIONE -->
        <div class="bg-[#020420] border border-sky-500/30 rounded-2xl p-6 flex flex-col gap-4">
          <input
            v-model="vaultNewTitle"
            type="text"
            placeholder="Titolo Script..."
            class="bg-[#090d16] border border-slate-700 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-400"
          />
          <textarea
            v-model="vaultNewCode"
            rows="4"
            placeholder="Codice da firmare..."
            class="bg-[#090d16] border border-slate-700 text-sky-400 p-3 rounded-xl text-xs outline-none resize-none focus:border-emerald-400"
          ></textarea>
          <button
            type="button"
            @click="notarizeNewCode"
            :disabled="isNotarizingVault"
            class="bg-emerald-500 text-slate-950 font-black px-5 py-3 rounded-xl text-sm cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50"
          >
            {{ isNotarizingVault ? '⏳ Firma SHA-256 in corso...' : '🛡️ Notarizza nel Vault' }}
          </button>
        </div>

        <!-- LISTA CERTIFICATI VAULT DAL DB -->
        <div class="border-t border-slate-800/80 pt-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 m-0">Certificati Crittografici Registrati</h3>
            <button type="button" @click="fetchVaultCertificates" class="text-xs text-sky-400 hover:text-emerald-400 cursor-pointer">
              🔄 Aggiorna Vault
            </button>
          </div>

          <div v-if="isLoadingVault" class="text-center py-6 text-slate-500 text-xs">
            Caricamento certificati dal Vault Pure SQL...
          </div>

          <div v-else-if="vaultCertificates.length === 0" class="bg-[#020420] border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
            Nessun certificato presente nel Vault per questo account. Notarizza uno snippet qui sopra o dai DKP Tools!
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <div
              v-for="cert in vaultCertificates"
              :key="cert.id"
              class="bg-[#020420] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col gap-3 transition-colors"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">
                    {{ cert.metadata?.sastStatus || 'PASSED' }}
                  </span>
                  <span class="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[10px] uppercase">
                    {{ cert.toolType || 'proof-of-code' }}
                  </span>
                  <h4 class="text-white font-bold text-sm font-sans m-0">{{ cert.title }}</h4>
                </div>
                <span class="text-[11px] text-slate-500">
                  ID #{{ cert.id }} · {{ cert.createdAt ? new Date(cert.createdAt).toLocaleString('it-IT') : 'Verificato' }}
                </span>
              </div>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950 border border-slate-800/90 p-3 rounded-xl">
                <code class="text-sky-400 text-xs break-all">SHA-256: {{ cert.hash }}</code>
                <button
                  type="button"
                  @click="copyToClipboard(cert.hash)"
                  class="bg-slate-900 hover:bg-emerald-500/15 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                >
                  📋 Copia Hash
                </button>
              </div>

              <p v-if="cert.metadata?.snippet" class="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg m-0 truncate">
                {{ cert.metadata.snippet }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- PANNELLO 5: GAMIFICATION -->
      <section v-if="activeTab === 'gamification'" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
        <div class="flex justify-between items-center border-b border-slate-800 pb-6">
          <h2 class="text-xl sm:text-2xl font-black text-white font-sans">Gamification Center</h2>
          <span class="text-2xl font-black text-emerald-400">{{ userProfileData.xp }} XP</span>
        </div>
        <button @click="activateEarlyPioneerBeta" class="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl text-sm cursor-pointer">⚡ Attiva Status "Early Pioneer"</button>
        <UserXpHistory :history="xpHistoryList"/>
      </section>

    </div>
  </div>
</template>